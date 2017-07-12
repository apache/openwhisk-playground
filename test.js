// Licensed to the Apache Software Foundation (ASF) under one or more contributor
// license agreements; and to You under the Apache License, Version 2.0.

const debug = require('debug')('openwhisk-playground-test')
const assert = require('assert')

var OpenWhiskPlayground = require("./openwhisk-playground.js")

// const config = { }
const playground = new OpenWhiskPlayground()

debug('invoking endpoint=' + playground.getEndpoint())

// code = load test-action-getnews.js
var fs = require('fs')

var sourceCode = fs.readFileSync('hello-action.js', 'utf-8')


function test() {
  const params = {
    actionName: 'hello-action.js',
    kind : 'nodejs:6',
    input_params: {},
    default_params: [],
    code : sourceCode
  }

  debug('invoking with params=' + JSON.stringify(params, null, 2))

  var success = function (result) {
    debug('success=' + JSON.stringify(result, null, 2))
  }

  var error = function (err) {
    debug('error=' + JSON.stringify(err, null, 2))
    assert.ok(false, ' failed '+ JSON.stringify(err));
  }

  // evaluate
  playground.setInjectLogRetrievalFailure(true)
  playground.evaluate(params, success, error)

}

test()

module.exports = test
