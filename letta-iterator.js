'use strict'

var letta = require('letta')

module.exports = function customIterator (app, options) {
  return function lettaIterator (fn, next) {
    letta.call(app, fn).then(function (res) {
      next.apply(app, [null].concat(res))
    }, function (err) {
      err.fn = fn
      if (options.settle) {
        return next.call(app, null, err)
      }
      next.call(app, err)
    })
  }
}
