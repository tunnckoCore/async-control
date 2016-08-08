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
    console.log('before all', this)
  })
  .on('beforeEach', function (fn, next) {
    console.log('before each:', fn.name)
  })
  .on('error', function (er, res, fn, next) {
    console.log('on error:', fn.name, er)
  })
  .on('afterEach', function (er, res, fn, next) {
    console.log('after each:', fn.name)
  })
  .on('after', function (er, res) {
    console.log('after all (it is like done callback)')
  })
  .series([
    function one (a, b, c, done) {
      this.one = 'one'
      // console.log('first:', this.one)
      // throw new Error('foo')
      fs.readFile('package.json', done)
    },
    function two (a, b, c) {
      this.two = 'two'
      // console.log('second:', this.two)
      // console.log('args:', a, b, c) // => 1 2 3
      // throw new Error('foo')
      return fs.readFileSync('not exist', 'utf8')
    },
    function three (a, b, c, done) {
      this.three = 'three'
      // console.log('third:', this.three)
      // console.log('ctx:', this)
      // console.log('args:', a, b, c) // => 1 2 3
      fs.readFile('package.json', done)
    },
    function * gen (a, b, c) {
      return Promise.resolve(123)
    },
    function sync (a, b, c) {
      return function (a, b, c, done) {
        done(null, [a, b, 23])
      }
    },
    function sync (a, b, c) {
      return function promise (a, b, c) {
        return Promise.resolve(555)
      }
    },
    function nested (a) {
      console.log('this1:', this)
      return function nested2 (aa, b) {
        console.log('this2:', this)
        return function sync (aaa, bb, c) {
          console.log('this3:', this)
          console.log('this.foo === 123?', this.foo === 123)
          return Promise.resolve([888, a, b, c])
        }
      }
    },
    function nesting (a) {
      return function foobar (aa, b) {
        return function nestedCb (aaa, bb, cc) {
          return function cbak (xx, yy, zz, done) {
            done(null, a + aa + aaa + xx) // 4
          }
        }
      }
    }
  ], {
    settle: true,
    params: [1, 2, 3],
    context: {
      foo: 123
    },
    letta: require('letta')
  }, function (er, res) {
    // console.log('err:', err) // => ENOENT Error
    console.log('res:', res) // => including Err object if `settle:true`
    console.log('done')
  })
