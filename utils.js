'use strict'

/**
 * Module dependencies
 */

var format = require('util').format
var utils = require('lazy-cache')(require)

/**
 * Temporarily re-assign `require` to trick browserify and
 * webpack into reconizing lazy dependencies.
 *
 * This tiny bit of ugliness has the huge dual advantage of
 * only loading modules that are actually called at some
 * point in the lifecycle of the application, whilst also
 * allowing browserify and webpack to find modules that
 * are depended on but never actually called.
 */

var fn = require
require = utils // eslint-disable-line no-undef, no-native-reassign

/**
 * Lazily required module dependencies
 */

require('async')
require('define-property', 'define')
require('extend-shallow', 'extend')
require('isarray', 'isArray')

/**
 * Restore `require`
 */

require = fn // eslint-disable-line no-undef, no-native-reassign

/**
 * > Factory used to create, validate and normalize `series` and `parallel` methods.
 *
 * @name   factory
 * @param  {AsyncControl} `app` instance.
 * @param  {String} `flow` type of the flow - parallel or series.
 * @return {Function} `series` or `parallel` method, depends on what is `flow` value.
 * @api private
 */
utils.factory = function factory (app, flow) {
  /**
   * > Iterate over `value` in parallel or serial flow.
   * The `async.map` or `async.mapSeries` method is used.
   *
   * @name   .series / .parallel
   * @param  {Object|Array|Function} `<value>` to iterate over.
   * @param  {Object} `[options]` can pass different hooks - before, after, beforeEach, afterEach.
   * @param  {Function} `[done]` if not passed, thunk is returned (function that accepts callback).
   * @return {Function} or `undefined` if `done` is passed.
   * @api private
   */
  return function seriesOrParallel (value, options, done) {
    if (typeof value === 'function') {
      value = [value]
    }
    if (typeof options === 'function') {
      done = options
      options = null
    }
    if (typeof value !== 'object' && typeof value !== 'function') {
      var msg = format('AsyncControl.%s `value` to be array, object or function.', flow)
      throw new TypeError(msg)
    }

    utils.normalize(this || app, value, options)

    if (typeof done !== 'function') {
      return function doneCallback (cb) {
        utils.async[flow](value, app.iterator, function callback () {
          app.options.after.apply(app, arguments)
          cb.apply(app, arguments)
        })
      }
    }
    utils.async[flow](value, app.iterator, function callback () {
      app.options.after.apply(app, arguments)
      done.apply(app, arguments)
    })
  }
}

/**
 * > Set and normalize defaults, input value, iterator and opitons.
 * Also calls the `before` hook.
 *
 * @name   normalize
 * @param  {Object} `app`
 * @param  {Object|Array|Function} `value` iterate over it
 * @param  {Object} `opts`
 * @return {Object}
 * @api private
 */
utils.normalize = function normalize (app, value, opts) {
  app.define('_input', value)
  app.options = utils.extend(app.options, opts)

  var iterator = app.options.iterator || app.iterator
  iterator = typeof iterator !== 'function' ? utils.createIterator : iterator

  app.define('iterator', iterator.call(app, app, app.options))
  app.options.before.call(app, value)
  return app
}

/**
 * > Returns default iterator which will be used in `async.map`
 * and for `async.mapSeries`. Below example shows how to create
 * your own iterator using `asyncControl.define` method.
 * This also can be done with passing function to `options.iterator`.
 *
 * **Example**
 *
 * ```js
 * const util = require('util')
 * const asyncControl = require('async-control')
 *
 * asyncControl.define('iterator', function customIterator (app, options) {
 *   // this === app
 *   return iterator (fn, next) {
 *     // this === app
 *     console.log(util.inspect(fn))
 *     next()
 *   }
 * })
 * asyncControl.series([
 *   function first (next) { next(null, 1) },
 *   function second (next) { next(null, 2) },
 *   function third (next) { next(null, 3) }
 * ], function (err, res) {
 *   // => [Function: first]
 *   // => [Function: second]
 *   // => [Function: third]
 *
 *   console.log(err, res)
 *   // => null, [1, 2, 3]
 * })
 * ```
 *
 * @name   createIterator
 * @param  {Object} `app` instance of AsyncControl
 * @param  {Object} `opts` the `app` options
 * @return {Function} iterator function passed directly to [async][async]
 * @api private
 */
utils.createIterator = function createIterator (app, opts) {
  var settle = typeof app.settle === 'boolean' ? app.settle : false
  settle = typeof opts.settle === 'boolean' ? !!opts.settle : !!settle

  return function defaultIterator (fn, next) {
    var res = null
    opts.beforeEach.apply(app, arguments)

    function done (err, res) {
      opts.afterEach.apply(app, arguments)
      if (err instanceof Error) {
        err.fn = fn
        return settle ? next(null, err) : next(err)
      }
      next(null, res)
    }

    try {
      res = fn.call(app, done)
    } catch (err) {
      res = err
    }

    return res instanceof Error ? done(res) : (res ? done(null, res) : null)
  }
}

/**
 * > Is `val` is object, but not array?
 *
 * @name   isObject
 * @param  {Mixed} `val`
 * @return {Boolean}
 * @api private
 */
utils.isObject = function isObject (val) {
  return typeof val === 'object' && !utils.isArray(val)
}

/**
 * Expose `utils` modules
 */

module.exports = utils