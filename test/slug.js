'use strict'

const assert = require('assert')

const zmd = require('../zmd')
const Slugger = zmd.Slugger

let slugger

describe('Slugger', function () {
  beforeEach(function () {
    slugger = new Slugger()
  })

  it('It should return a lowercase string', function () {
    assert.strictEqual(slugger.get('Test'), 'test')
  })

  it('It should support collisons', function () {
    assert.strictEqual(slugger.get('test'), 'test')
    assert.strictEqual(slugger.get('test'), 'test-1')
    assert.strictEqual(slugger.get('test'), 'test-2')
  })

  it('It should support number collisions', function () {
    assert.strictEqual(slugger.get('test 1'), 'test-1')
    assert.strictEqual(slugger.get('test'), 'test')
    assert.strictEqual(slugger.get('test'), 'test-2')
  })

  it('It should remove punctuation character', function () {
    assert.strictEqual(slugger.get('demo.html'), 'demohtml')
    assert.strictEqual(slugger.get('test#section'), 'testsection')
  })

  it('It should replace space to -', function () {
    assert.strictEqual(slugger.get('space between'), 'space-between')
  })
})
