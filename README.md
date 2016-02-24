# [async-control][author-www-url] [![npmjs.com][npmjs-img]][npmjs-url] [![The MIT License][license-img]][license-url] 

> Ultimate asynchronous control flow goodness with built-in hook system and compose, series, define and parallel methods. Uses async.map and async.mapSeries methods. Allows passing custom iterator function.

[![code climate][codeclimate-img]][codeclimate-url] [![standard code style][standard-img]][standard-url] [![travis build status][travis-img]][travis-url] [![coverage status][coveralls-img]][coveralls-url] [![dependency status][david-img]][david-url]

## Install
```
npm i async-control --save
```

## Usage
> For more use-cases see the [tests](./test.js)

```js
const fs = require('fs')
const asyncControl = require('async-control')

asyncControl.series([
  function one (next) {
    fs.readFile('package.json', 'utf8', next)
  },
  function two (next) {
    console.log('second')
    fs.stat('not exist', next)
  },
  function three (next) {
    console.log('third')
    next(null, 123)
  }
], {settle: false}, function done (err, res) {
  console.log('err:', err)
  // => if `options.settle` is true - `undefined`, otherwise thrown Error
  console.log('res:', res) // => array of results
  // => res[0] is content of package.json file
  // => res[1] is `undefined`, because second function throws Error (ENOENT)
  // if `options.settle` is true
  // - res[1] will be Error
  // - res[2] will be 123
})
```

### [AsyncControl](index.js#L50)
> Initialize `AsyncControl` with `options`.

**Params**

* `[options]` **{Object}**: optional options for more control 
  + `settle` **{Boolean}**: pass `true` to force continue iterating after first error occurred.
  + `iterator` **{Function}**: custom iterator function
  + `before` **{Function}**: before all hook.
  + `beforeEach` **{Function}**: hook, called before each item/function.
  + `after` **{Function}**: after all hook.
  + `afterEach` **{Function}**: hook, called after each item/function.

**Example**

```js
const util = require('util')
const AsyncControl = require('async-control').AsyncControl

function MyApp (options) {
  if (!(this instanceof MyApp)) {
    return new MyApp(options)
  }
  AsyncControl.call(this, options)
}

util.inherits(MyApp, AsyncControl)

const app = new MyApp({settle: true})
```

### [.compose](index.js#L108)
> Compose `series` or `parallel` method. Can be used to create `settleSeries` or `settleParallel` methods for example.

**Params**

* `<flow>` **{String}**: type of flow, available are `'parallel'`, `'series'`, `'map'` and `'mapSeries'`.    
* `[options]` **{Object}**: can pass different hooks - before, after, beforeEach, afterEach.    
* `returns` **{Function}**: composed `series` or `parallel` method.  

**Example**

```js
const fs = require('fs')
const asyncControl = require('async-control')

// the internal `.series` method is created this way - using `.compose`
var series = asyncControl.compose('series')
series([
  function one (cb) {
    cb(null, 123)
  },
  function two (cb) {
    fs.readFile('not exist', cb)
  },
  function three (cb) {
    cb(null, 456)
  }
], {settle: true}, console.log) //=> null, [123, ENOENT Error, 456]
```

### [.series](index.js#L154)
> Iterate over `value` in serial flow. The `async.mapSeries` method is used.

**Params**

* `<value>` **{Object|Array|Function}**: to iterate over.    
* `[options]` **{Object}**: can pass different hooks - before, after, beforeEach, afterEach.    
* `[done]` **{Function}**: if not passed, thunk is returned (function that accepts callback).    
* `returns` **{Function}**: or `undefined` if `done` is passed.  

**Example**

```js
const fs = require('fs')
const asyncControl = require('async-control')

asyncControl.series([
  function one (cb) {
    cb(null, 'foo')
  },
  function two (cb) {
    fs.readFile('not exist', cb)
  },
  function three (cb) {
    cb(null, 'bar')
  }
], console.log) //=> ENOENT Error, ['foo', undefined]
```

### [.parallel](index.js#L201)
> Iterate over `value` in parallel flow. The `async.map` method is used.

**Params**

* `<value>` **{Object|Array|Function}**: to iterate over.    
* `[options]` **{Object}**: can pass different hooks - before, after, beforeEach, afterEach.    
* `[done]` **{Function}**: if not passed, thunk is returned (function that accepts callback).    
* `returns` **{Function}**: or `undefined` if `done` is passed.  

**Example**

```js
const fs = require('fs')
const asyncControl = require('async-control')

asyncControl.parallel([
  function one (next) {
    setTimeout(function () {
      console.log('first')
      next(null, 100)
    }, Math.random() * 50)
  },
  function two (next) {
    setTimeout(function () {
      console.log('second')
      next(null, 700)
    }, Math.random() * 200)
  },
  function three (next) {
    setTimeout(function () {
      console.log('third')
      next(null, 2000)
    }, 0)
  }
], function done (err, res) {
  // => third
  // => first
  // => second

  console.log(err) // => null
  console.log(res) // => [2000, 100, 700]
})
```

### [.define](index.js#L227)
> Define a non-enumerable property on the instance. Can be used to pass custom iterator function or define other methods.

**Params**

* `key` **{String}**: the name of the property to define.    
* `val` **{Mixed}**: the descriptor for the property being defined or modified.    
* `returns` **{AsyncControl}**: instance for chaining.  

**Example**

```js
const asyncControl = require('async-control')

asyncControl.define('hello', function (key, val) {
  console.log('Hello', key, val)
})
asyncControl.hello('foo', 'world!') // => 'Hello foo world!'
```

### Custom iterator
> Below example shows how to create your own iterator using `asyncControl.define` method. This also can be done by passing function to `options.iterator`. It recieves `app` and `options` and must return function which is directly passed to `async.map` and/or `async.mapSeries` methods. 

**Params**

* `app` **{Object}**: instance of AsyncControl    
* `opts` **{Object}**: the `app` options    
* `returns` **{Function}**: iterator passed directly to [async.map / async.mapSeries](http://j.mp/1QyzUe9)

**Example**

```js
const util = require('util')
const asyncControl = require('async-control')

asyncControl.define('iterator', function customIterator (app, options) {
  // this === app
  return iterator (fn, next) {
    // this === app
    console.log(util.inspect(fn))
    next()
  }
})
asyncControl.series([
  function first (next) { next(null, 1) },
  function second (next) { next(null, 2) },
  function third (next) { next(null, 3) }
], function (err, res) {
  // => [Function: first]
  // => [Function: second]
  // => [Function: third]

  console.log(err, res)
  // => null, [1, 2, 3]
})
```

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/hybridables/async-control/issues/new).  
But before doing anything, please read the [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines.

## [Charlike Make Reagent](http://j.mp/1stW47C) [![new message to charlike][new-message-img]][new-message-url] [![freenode #charlike][freenode-img]][freenode-url]

[![tunnckoCore.tk][author-www-img]][author-www-url] [![keybase tunnckoCore][keybase-img]][keybase-url] [![tunnckoCore npm][author-npm-img]][author-npm-url] [![tunnckoCore twitter][author-twitter-img]][author-twitter-url] [![tunnckoCore github][author-github-img]][author-github-url]

[async]: https://github.com/caolan/async
[define-property]: https://github.com/jonschlinkert/jonschlinkert/define-property
[extend-shallow]: https://github.com/jonschlinkert/jonschlinkert/extend-shallow
[isarray]: https://github.com/juliangruber/isarray
[lazy-cache]: https://github.com/jonschlinkert/jonschlinkert/lazy-cache

[npmjs-url]: https://www.npmjs.com/package/async-control
[npmjs-img]: https://img.shields.io/npm/v/async-control.svg?label=async-control

[license-url]: https://github.com/hybridables/async-control/blob/master/LICENSE
[license-img]: https://img.shields.io/badge/license-MIT-blue.svg

[codeclimate-url]: https://codeclimate.com/github/hybridables/async-control
[codeclimate-img]: https://img.shields.io/codeclimate/github/hybridables/async-control.svg

[travis-url]: https://travis-ci.org/hybridables/async-control
[travis-img]: https://img.shields.io/travis/hybridables/async-control/master.svg

[coveralls-url]: https://coveralls.io/r/hybridables/async-control
[coveralls-img]: https://img.shields.io/coveralls/hybridables/async-control.svg

[david-url]: https://david-dm.org/hybridables/async-control
[david-img]: https://img.shields.io/david/hybridables/async-control.svg

[standard-url]: https://github.com/feross/standard
[standard-img]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

[author-www-url]: http://www.tunnckocore.tk
[author-www-img]: https://img.shields.io/badge/www-tunnckocore.tk-fe7d37.svg

[keybase-url]: https://keybase.io/tunnckocore
[keybase-img]: https://img.shields.io/badge/keybase-tunnckocore-8a7967.svg

[author-npm-url]: https://www.npmjs.com/~tunnckocore
[author-npm-img]: https://img.shields.io/badge/npm-~tunnckocore-cb3837.svg

[author-twitter-url]: https://twitter.com/tunnckoCore
[author-twitter-img]: https://img.shields.io/badge/twitter-@tunnckoCore-55acee.svg

[author-github-url]: https://github.com/tunnckoCore
[author-github-img]: https://img.shields.io/badge/github-@tunnckoCore-4183c4.svg

[freenode-url]: http://webchat.freenode.net/?channels=charlike
[freenode-img]: https://img.shields.io/badge/freenode-%23charlike-5654a4.svg

[new-message-url]: https://github.com/tunnckoCore/ama
[new-message-img]: https://img.shields.io/badge/ask%20me-anything-green.svg