#OpenWhisk Playground

## Usage

This library provides functionality of executing
a snippet of source code as OpenWhisk action for 
OpenWhisk Xcode Source Editor Extension 
in order to test Swift OpenWhisk functions quickly.
More details in https://github.com/openwhisk/openwhisk-xcode

## Development and testing

```
DEBUG=openwhisk-playground nodemon test.js
```

and with more debugging

```
DEBUG=openwhisk-playground-test,openwhisk-playground nodemon ./test.js
```
