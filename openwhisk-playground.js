// Licensed to the Apache Software Foundation (ASF) under one or more contributor
// license agreements; and to You under the Apache License, Version 2.0.

'use strict';

const debug = require('debug')('openwhisk-playground')
const openwhisk = require('openwhisk');
const fs = require("fs");
const path = require("path");
const PropertiesReader = require('properties-reader');

var loadDefaultAuth = function () {
  //Expected cat ~/.wskprops
  //APIHOST=openwhisk.ng.bluemix.net
  //NAMESPACE=
  //AUTH=8b6d8615-9
  const userDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
  const wskFilePath = path.format({ dir: userDir, base: '.wskprops' });
  var wskProperties = PropertiesReader(wskFilePath)
  var auth = wskProperties.get('AUTH')
  return auth
}

const DEFAULT_OW_API_URL = process.env.OW_API_URL || 'https://openwhisk.ng.bluemix.net/api/v1/'
const DEFAULT_OW_NAMESPACE = process.env.OW_NAMESPACE || '_'
const DEFAULT_OW_API_KEY = process.env.OW_API_KEY

var playground = function (config) {
  if (!config) {
    config = {}
  }
  var api_key = config.api_key
  if (!api_key) {
    if (DEFAULT_OW_API_KEY) {
      api_key = DEFAULT_OW_API_KEY
    } else {
      api_key = loadDefaultAuth()
    }
  }
  var api = config.api
  if (!api) {
    api = DEFAULT_OW_API_URL
  }
  var api = config.api
  if (!api) {
    api = DEFAULT_OW_API_URL
  }
  var namespace = config.namespace
  if (!namespace) {
    namespace = DEFAULT_OW_NAMESPACE
  }
  //console.log('auth=' + auth)
  this.owParams = { api: api, api_key: api_key, namespace: namespace }
  this.ow = openwhisk(this.owParams)
}

playground.prototype.setInjectLogRetrievalFailure = function (inject) {
  this.injectLogRetrievalFailure = inject;
}

playground.prototype.getEndpoint = function () {
  return this.owParams.api;
}

playground.prototype.getApiKey = function () {
  return this.owParams.api_key;
}

playground.prototype.getParameters = function () {
  return this.owParams;
}


function merge(obj1, obj2) {
  var obj3 = {};
  if (obj1.constructor.name !== 'Object') {
    obj3.name = obj1.constructor.name
    obj3.message = "" + obj1
  } else {
    for (var attrName1 in obj1) {
      obj3[attrName1] = obj1[attrName1]
    }
  }
  for (var attrName2 in obj2) {
    obj3[attrName2] = obj2[attrName2]
  }
  return obj3;
}

function MyBaseOperationError(message, error) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.error = error;
}

function timeout(duration) {
  return new Promise(function (resolve) {
    setTimeout(resolve, duration)
  })
}

playground.prototype.evaluate = function (params, success, errors) {
  const actionName = params.actionName
  const kind = params.kind
  const input_params = params.input_params
  const default_params = params.default_params
  const code = params.code
  debug('evaluate invoking OW actionName=' + actionName + ' kind=' + kind + ' input_params=' + JSON.stringify(input_params) + ' default_params=' + JSON.stringify(default_params) + ' code=' + code)
  //require('request-debug')(ow.actions.get_rp());
  const options = {
    actionName: actionName
  };
  options.action = {
    parameters: default_params,
    exec: { actionName: actionName, code: code, kind: kind }
  }
  //ow.actions.update({actionName: actionName, action: code, kind: kind, params: default_params }).then(result => {
  const ow = this.ow
  const pipelineResults = {}
  pipelineResults.listOfResults = []
  var activationId = null
  ow.actions.update(options)
    .then(result => {
      pipelineResults.listOfResults.push(result)
      debug("evaluate updated result=" + JSON.stringify(result));
      return ow.actions.invoke({ actionName: actionName, params: input_params, blocking: true })
    })
    .then(invoke_result => {
      pipelineResults.listOfResults.push(invoke_result)
      debug("evaluate invoked invoke_result=" + JSON.stringify(invoke_result))
      activationId = invoke_result.activationId
      debug("evaluate activationId=" + activationId);
      if (this.injectLogRetrievalFailure) {
        throw new MyBaseOperationError('failed', null)
      }
      return ow.activations.get({ activation: activationId })
    })
    // .then(log_result => {
    //pipelineResults.list.push(log_result)
    //   console.log('evaluate activati o nget log_result=' + JSON.stringify(log_result))
    //   return log_result
    // })
    .catch(err => {
      if (activationId) {
        const waitMs = 1000
        debug('evaluate retry log retrieval after ' + waitMs + 'ms err=' + JSON.stringify(err))
        return timeout(waitMs).then(function () {
          debug('evaluate skipping err=' + err + ' to get logs for ' + activationId)
          return ow.activations.get({ activation: activationId })
        })
      } else {
        debug('evaluate re-throw err=' + err)
        throw err
      }
    })
    .then(result => {
      //console.log('evaluate pipelineResults=' + JSON.stringify(pipelineResults, null, 2))
      // console.log('evaluate final result=' + JSON.stringify(result, null, 2))
      var mergedResult = merge(result, pipelineResults)
      debug('evaluate final success mergedResult=' + JSON.stringify(mergedResult, null, 2))
      success(mergedResult)
    })
    .catch(err => {
      console.log('evaluate final err=' + err)     //pipelineResults.list.push(err)
      var mergedResult = merge(err, pipelineResults)
      debug('evaluate final errors mergedResult=' + JSON.stringify(mergedResult, null, 2))
      errors(mergedResult)
    })
}

module.exports = playground

