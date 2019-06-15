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
    assert.equal(slugger.get('Test'), 'test')
  })

  it('It should support collisons', function () {
    assert.equal(slugger.get('test'), 'test')
    assert.equal(slugger.get('test'), 'test-1')
    assert.equal(slugger.get('test'), 'test-2')
  })

  it('It should support number collisions', function () {
    assert.equal(slugger.get('test 1'), 'test-1')
    assert.equal(slugger.get('test'), 'test')
    assert.equal(slugger.get('test'), 'test-2')
  })

  it('It should remove punctuation character', function () {
    assert.equal(slugger.get('demo.html'), 'demohtml')
    assert.equal(slugger.get('test#section'), 'testsection')
  })

  it('It should replace space to -', function () {
    assert.equal(slugger.get('space between'), 'space-between')
  })
})
