/*!
 * async-control <https://github.com/hybridables/async-control>
 *
 * Copyright (c) 2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var fs = require('fs')
var asyncControl = require('./refactor')

// asyncControl.define('iterator', require('./letta-iterator'))
asyncControl.series([
  function one (done) {
    this.one = 'one'
    // console.log('first:', this.one)
    // throw new Error('foo')
    fs.readFile('package.json', done)
  },
  function two () {
    // console.log(this.one)
    this.two = 'two'
    // throw new Error('foo')
    return fs.readFileSync('not exist', 'utf8')
  },
  function three (done) {
    // console.log(this.two)
    this.three = 'three'
    // console.log(this.three)
    fs.readFile('package.json', done)
  }
], function (err, res) {
  console.log('err:', err) // => ENOENT Error
  console.log('res:', res) // => [Buffer, undefined]
  console.log('done')
})
