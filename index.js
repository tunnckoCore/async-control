/*!
 * async-control <https://github.com/hybridables/async-control>
 *
 * Copyright (c) 2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

var util = require('util')
var utils = require('./utils')
var noop = function noop () {}

/**
 * > Initialize `AsyncControl` with `options`.
 *
 * **Example**
 *
 * ```js
 * const util = require('util')
 * const AsyncControl = require('async-control').AsyncControl
 *
 * function MyApp (options) {
 *   if (!(this instanceof MyApp)) {
 *     return new MyApp(options)
 *   }
 *   AsyncControl.call(this, options)
 * }
 *
 * util.inherits(MyApp, AsyncControl)
 *
 * const app = new MyApp({settle: true})
 * ```
 *
 * @name  AsyncControl
 * @param {Object} `options` optional options for more control
 * @property {Boolean} [options] `settle` pass `true` to force continue iterating after first error occurred.
 * @property {Function} [options] `iterator` custom iterator function
 * @property {Function} [options] `before` before all hook.
 * @property {Function} [options] `beforeEach` hook, called before each item/function.
 * @property {Function} [options] `after` after all hook.
 * @property {Function} [options] `afterEach` hook, called after each item/function.
 * @api public
 */
function AsyncControl (options) {
  if (!(this instanceof AsyncControl)) {
    return new AsyncControl(options)
  }

  options = utils.isObject(options) ? options : {}
  this._initAsyncControl(options)
}

/**
 * > Used to create default methods. Adds three methods
 * to the instance: compose, series and parallel.
 *
 * @name   ._initAsyncControl
 * @param  {Object} `[options]`
 * @return {AsyncControl} instance for chaining.
 * @api private
 */
utils.define(AsyncControl.prototype, '_initAsyncControl', function _initAsyncControl (options) {
  this.options = utils.extend({
    settle: false,
    before: noop,
    beforeEach: noop,
    after: noop,
    afterEach: noop
  }, this.options, options)

  /**
   * > Compose `series` or `parallel` method. Can be used to
   * create `settleSeries` or `settleParallel` methods for example.
   *
   * **Example**
   *
   * ```js
   * const fs = require('fs')
   * const asyncControl = require('async-control')
   *
   * // the internal `.series` method is created this way - using `.compose`
   * var series = asyncControl.compose('series')
   * series([
   *   function one (cb) {
   *     cb(null, 123)
   *   },
   *   function two (cb) {
   *     fs.readFile('not exist', cb)
   *   },
   *   function three (cb) {
   *     cb(null, 456)
   *   }
   * ], {settle: true}, console.log) //=> null, [123, ENOENT Error, 456]
   * ```
   *
   * @name   .compose
   * @param  {String} `<flow>` type of flow, available are `'parallel'`, `'series'`, `'map'` and `'mapSeries'`.
   * @param  {Object} `[options]` can pass different hooks - before, after, beforeEach, afterEach.
   * @return {Function} composed `series` or `parallel` method.
   * @api public
   */
  this.define('compose', function compose (flow, options) {
    if (typeof flow !== 'string') {
      throw new TypeError('asyncControl.compose expect a string')
    }

    flow = flow === 'series' ? 'mapSeries' : flow
    flow = flow === 'parallel' ? 'map' : flow

    if (['mapSeries', 'map'].indexOf(flow) === -1) {
      var msg = util.format('AsyncControl.compose `flow` to be string - parallel or series')
      throw new TypeError(msg)
    }

    this.options = options ? utils.extend(this.options, options) : this.options
    return utils.factory(this, flow)
  })

  /**
   * > Iterate over `value` in serial flow. The `async.mapSeries` method is used.
   *
   * **Example**
   *
   * ```js
   * const fs = require('fs')
   * const asyncControl = require('async-control')
   *
   * asyncControl.series([
   *   function one (cb) {
   *     cb(null, 'foo')
   *   },
   *   function two (cb) {
   *     fs.readFile('not exist', cb)
   *   },
   *   function three (cb) {
   *     cb(null, 'bar')
   *   }
   * ], console.log) //=> ENOENT Error, ['foo', undefined]
   * ```
   *
   * @name   .series
   * @param  {Object|Array|Function} `<value>` to iterate over.
   * @param  {Object} `[options]` can pass different hooks - before, after, beforeEach, afterEach.
   * @param  {Function} `[done]` if not passed, thunk is returned (function that accepts callback).
   * @return {Function} or `undefined` if `done` is passed.
   * @api public
   */
  this.define('series', this.compose('series'))

  /**
   * > Iterate over `value` in parallel flow. The `async.map` method is used.
   *
   * **Example**
   *
   * ```js
   * const fs = require('fs')
   * const asyncControl = require('async-control')
   *
   * asyncControl.parallel([
   *   function one (next) {
   *     setTimeout(function () {
   *       console.log('first')
   *       next(null, 100)
   *     }, Math.random() * 50)
   *   },
   *   function two (next) {
   *     setTimeout(function () {
   *       console.log('second')
   *       next(null, 700)
   *     }, Math.random() * 200)
   *   },
   *   function three (next) {
   *     setTimeout(function () {
   *       console.log('third')
   *       next(null, 2000)
   *     }, 0)
   *   }
   * ], function done (err, res) {
   *   // => third
   *   // => first
   *   // => second
   *
   *   console.log(err) // => null
   *   console.log(res) // => [2000, 100, 700]
   * })
   * ```
   *
   * @name   .parallel
   * @param  {Object|Array|Function} `<value>` to iterate over.
   * @param  {Object} `[options]` can pass different hooks - before, after, beforeEach, afterEach.
   * @param  {Function} `[done]` if not passed, thunk is returned (function that accepts callback).
   * @return {Function} or `undefined` if `done` is passed.
   * @api public
   */
  this.define('parallel', this.compose('parallel'))

  return this
})

/**
 * > Define a non-enumerable property on the instance.
 * Can be used to pass custom iterator function or define other methods.
 *
 * **Example**
 *
 * ```js
 * const asyncControl = require('async-control')
 *
 * asyncControl.define('hello', function (key, val) {
 *   console.log('Hello', key, val)
 * })
 * asyncControl.hello('foo', 'world!') // => 'Hello foo world!'
 * ```
 *
 * @name  .define
 * @param {String} `key` the name of the property to define.
 * @param {Mixed} `val` the descriptor for the property being defined or modified.
 * @return {AsyncControl} instance for chaining.
 * @api public
 */
utils.define(AsyncControl.prototype, 'define', function defineProperty (key, val) {
  utils.define(this, key, val)
  return this
})

/**
 * Expose `AsyncControl` constructor and instance.
 */

module.exports = new AsyncControl()
module.exports.AsyncControl = AsyncControl
