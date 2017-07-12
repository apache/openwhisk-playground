// Licensed to the Apache Software Foundation (ASF) under one or more contributor
// license agreements; and to You under the Apache License, Version 2.0.

function main() {
    console.log('log action started')
//   return {payload: 'Hello world'};
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        console.log('log action finished')
        resolve({ done: true, payload: 'result Hello world2' });
      }, 1000);
   })
}
