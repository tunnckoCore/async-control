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
require('async-base-iterator', 'base')
require('extend-shallow', 'extend')

/**
 * Restore `require`
 */

require = fn // eslint-disable-line no-undef, no-native-reassign

/**
 * > Factory used to create, validate and normalize `series` and `parallel` methods.
 *
 * @name   factory
 * @param  {AsyncControl} `app`
 * @param  {String} `flow`
 * @return {Function}
 * @private
 */
utils.factory = function factory (app, flow) {
  /**
   * > Iterate over `value` in parallel or series flow.
   * The `async.map` or `async.mapSeries` method is used.
   *
   * @param  {Object|Array|Function} `value`
   * @param  {Object=} `options`
   * @param  {Function=} `done`
   * @return {Function}
   * @private
   */
  return function seriesOrParallel (value, options, done) {
    var argz = utils.validateArgs(flow, value, options, done)
    utils.normalize.call(this, app, argz.value, argz.options)

    if (typeof argz.done === 'function') {
      utils.async[flow](argz.value, app.iterator, utils.doneCallback(app, argz.done))
      return
    }

    return function thunk (cb) {
      if (typeof cb !== 'function') {
        var msg = format('AsyncControl.%s `done` to be function.', flow)
        throw new TypeError(msg)
      }
      utils.async[flow](argz.value, app.iterator, utils.doneCallback(app, cb))
    }
  }
}

/**
 * > Final (done) callback. Also calls the `after` hook.
 *
 * @param  {Object}   app
 * @param  {Function} done
 * @return {Function} callback
 * @private
 */
utils.doneCallback = function doneCallback (app, done) {
  return function callback () {
    if (typeof app.options.after === 'function') {
      app.options.after.apply(app.options.context, arguments)
    }
    if (typeof app.emit === 'function') {
      var args = [].slice.call(arguments)
      app.emit.apply(app.options.context, ['after'].concat(args))
    }
    done.apply(app, arguments)
  }
}

/**
 * > Set and normalize defaults, input value, iterator and opitons.
 * Also calls the `before` hook.
 *
 * @param  {Object} `app`
 * @param  {Object|Array|Function} `value`
 * @param  {Object} `options`
 * @return {Object}
 * @private
 */
utils.normalize = function normalize (app, value, options) {
  app.define('_input', value)
  app.options = options ? utils.extend(app.options, options) : app.options
  app.options.context = app.options.context || this

  var opts = app.options

  if (typeof opts.before === 'function') {
    opts.before.call(opts.context, app, value)
  }
  if (typeof app.emit === 'function') {
    app.emit.call(opts.context, 'before', app, value)
  }

  var makeIterator = utils.base.makeIterator.bind(utils.base)
  var iterator = app.options.iterator || app.iterator
  iterator = typeof iterator !== 'function' ? makeIterator : iterator
  iterator = iterator(app.options)
  app.define('iterator', iterator)

  return app
}

/**
 * > Validates incoming arguments.
 *
 * @param  {Object|Array|Function} `value`
 * @param  {Object=} `options`
 * @param  {Function=} `done`
 * @return {Object}
 * @private
 */
utils.validateArgs = function validateArgs (flow, value, options, done) {
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

  return {
    value: value,
    options: options,
    done: done
  }
}

/**
 * > Expose `utils` modules.
 *
 * @type {Object}
 * @private
 */
module.exports = utils
