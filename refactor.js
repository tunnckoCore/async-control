'use strict'

var util = require('util')
var utils = require('./utils')
var AppBase = require('app-base').AppBase
var noop = function noop () {}

function AsyncControl (options) {
  if (!(this instanceof AsyncControl)) {
    return new AsyncControl(options)
  }
  AppBase.call(this)
  this.defaults(options)
}

AppBase.extend(AsyncControl)
AppBase.delegate(AsyncControl.prototype, {
  compose: function compose (flow, options) {
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
  },
  defaults: function defaults (options) {
    this.options = utils.extend({
      settle: false,
      before: noop,
      beforeEach: noop,
      after: noop,
      afterEach: noop
    }, this.options, options)

    this.define('series', this.compose('series'))
    this.define('parallel', this.compose('parallel'))
  }
})

/**
 * Expose `AsyncControl` constructor and instance.
 */

module.exports = new AsyncControl()
module.exports.AsyncControl = AsyncControl
