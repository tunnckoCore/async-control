/*!
 * async-control <https://github.com/tunnckoCore/async-control>
 *
 * Copyright (c) 2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var fs = require('fs')
var asyncControl = require('./index')

asyncControl
  .on('before', function () {
    console.log('before all')
  })
  .on('beforeEach', function (fn, next) {
    console.log('before each:', fn.name)
  })
  .on('error', function (er, res) {
    console.log('on error:', er)
  })
  .on('afterEach', function (er, res, fn, next) {
    console.log('after each:', fn.name)
  })
  .on('after', function () {
    console.log('after all', this)
  })
  .series([
    function one (a, b, c, done) {
      this.one = 'one'
      console.log('first:', this.one)
      // throw new Error('foo')
      fs.readFile('package.json', done)
    },
    function two (a, b, c) {
      this.two = 'two'
      console.log('second:', this.two)
      console.log('args:', a, b, c) // => 1 2 3
      // throw new Error('foo')
      return fs.readFileSync('not exist', 'utf8')
    },
    function three (a, b, c, done) {
      this.three = 'three'
      console.log('third:', this.three)
      console.log('ctx:', this)
      console.log('args:', a, b, c) // => 1 2 3
      fs.readFile('package.json', done)
    }
  ], {
    settle: true,
    params: [1, 2, 3],
    context: {
      foo: 123
    }
  }, function (err, res) {
    console.log('err:', err) // => ENOENT Error
    console.log('res:', res) // => [Buffer, undefined]
    console.log('done')
  })
