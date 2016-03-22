/*!
 * async-control <https://github.com/hybridables/async-control>
 *
 * Copyright (c) 2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

var utils = require('./utils')
var AppBase = require('async-base-iterator').AsyncBaseIterator
var noop = function noop () {}

/**
 * > Initialize `AsyncControl` with `options` to
 * control enabling/disabling `options.settle`, passing
 * custom `iterator` and pass different hooks - before, after, etc.
 *
 * @name  AsyncControl
 * @param {Object=} `options`
 * @api public
 */
function AsyncControl (options) {
  if (!(this instanceof AsyncControl)) {
    return new AsyncControl(options)
  }
  AppBase.call(this, options)
  this.defaultOptions({before: noop, after: noop})
  this.initAsyncControl()
}

AppBase.extend(AsyncControl)

/**
 * > Used to add a few methods to the instance
 * - compose (non-enumerable), series and parallel.
 *
 * @name   initAsyncControl
 * @return {AsyncControl}
 * @private
 */
AppBase.define(AsyncControl.prototype, 'initAsyncControl', function initAsyncControl () {
  /**
   * > Iterate over `value` in series flow.
   * The `async.mapSeries` method is used.
   *
   * **Example**
   *
   * ```js
   * var fs = require('fs')
   * var asyncControl = require('async-control')
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
   * @see    .compose
   * @name   .series
   * @param  {Object|Array|Function} `value` The value to iterate over.
   * @param  {Object=} `options` Can pass different hooks - before, after, beforeEach, afterEach.
   * @param  {Function=} `done` If not passed, thunk is returned (function that accepts callback).
   * @return {Function} Or `undefined` if `done` is passed.
   * @api public
   */

  AsyncControl.prototype.series = this.compose('series')

  /**
   * > Iterate over `value` in parallel flow.
   * The `async.map` method is used.
   *
   * **Example**
   *
   * ```js
   * var fs = require('fs')
   * var asyncControl = require('async-control')
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
   * @see    .compose
   * @name   .parallel
   * @param  {Object|Array|Function} `value` The value to iterate over.
   * @param  {Object=} `options` Can pass different hooks - before, after, beforeEach, afterEach.
   * @param  {Function=} `done` If not passed, thunk is returned (function that accepts callback).
   * @return {Function} Or `undefined` if `done` is passed.
   * @api public
   */

  AsyncControl.prototype.parallel = this.compose('parallel')

  return this
})

/**
 * > Compose `series` or `parallel` method. Can be used to
 * create `settleSeries` or `settleParallel` methods for example.
 *
 * **Example**
 *
 * ```js
 * var fs = require('fs')
 * var asyncControl = require('async-control')
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
 * @see    utils.factory
 * @name   .compose
 * @param  {String} `flow` Type of flow, one of `'series'` or `'parallel'`.
 * @param  {Object=} `options` Can pass different hooks - before, after, beforeEach, afterEach.
 * @return {Function} Composed `series` or `parallel` method, depends on `flow`.
 * @api public
 */

AppBase.define(AsyncControl.prototype, 'compose', function compose (flow, options) {
  if (typeof flow !== 'string') {
    throw new TypeError('asyncControl.compose expect a string')
  }

  flow = flow === 'series' ? 'mapSeries' : flow
  flow = flow === 'parallel' ? 'map' : flow

  if (['mapSeries', 'map'].indexOf(flow) === -1) {
    var util = require('util')
    var msg = util.format('AsyncControl.compose `flow` to be string - parallel or series')
    throw new TypeError(msg)
  }

  this.options = options ? utils.extend(this.options, options) : this.options
  return utils.factory(this, flow)
})

/**
 * > Expose `AsyncControl` instance.
 *
 * @type {AsyncControl}
 * @private
 */
module.exports = new AsyncControl()

/**
 * > Expose `AsyncControl` constructor.
 *
 * @type {Function}
 * @private
 */
module.exports.AsyncControl = AsyncControl
