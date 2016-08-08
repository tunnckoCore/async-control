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
require('dezalgo')
require('extend-shallow', 'extend')
require('once')

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
    var iterator = utils.normalize.call(this, app, argz.value, argz.options)

    if (typeof argz.done === 'function') {
      utils.async[flow](argz.value, iterator, utils.doneCallback(app, argz.done))
      return
    }

    return function thunk (cb) {
      if (typeof cb !== 'function') {
        var msg = format('AsyncControl.%s `done` to be function.', flow)
        throw new TypeError(msg)
      }
      utils.async[flow](argz.value, iterator, utils.doneCallback(app, cb))
    }
  }
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

  if (typeof app.options.before === 'function') {
    app.on('before', app.options.before)
  }
  if (typeof app.options.after === 'function') {
    app.on('after', app.options.after)
  }

  app.emit('before', app, value)
  if (typeof app.options.iterator === 'function') {
    return app.wrapIterator(app.options.iterator, app.options)
  }
  return app.makeIterator(app.options)
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
  return utils.once(utils.dezalgo(function callback (err, res) {
    app.emit('after', err, res, app)
    done.apply(app, arguments)
  }))
}

/**
 * > Expose `utils` modules.
 *
 * @type {Object}
 * @private
 */
module.exports = utils
