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
