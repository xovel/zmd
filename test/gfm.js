'use strict'

// const assert = require('assert')

const zmd = require('../zmd')

const fs = require('fs')
const path = require('path')

// function read(name) {
//   return fs.readFileSync(path.join(__dirname, name)).toString()
// }

function write(filepath, content) {
  fs.writeFileSync(path.join(__dirname, filepath), content)
}

const gfm = require('../spec/gfm.json')

const result = []

gfm.forEach(item => {
  try {
    item.zzmd = zmd(item.markdown, {
      xhtml: true,
      headerIds: false,
      autourl: true
    })
  } catch (error) {
    item.zmd = error.message
    console.log(error, item)
  }
  result.push(item)
})

write('gfm.json', JSON.stringify(result, null, '  '))
