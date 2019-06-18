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
      autourl: item.section === 'Autolinks (extension)',
      encodeURI: true,
      ignoreBlankLine: false
    })
    if (item.html.indexOf('\t') > -1)
      item._html = item.html.replace(/\t/g, '    ')
    if (/&(?:#(?:\d+)|(?:#[xX][0-9a-fA-F]+))/.test(item.zzmd))
      item._zzmd = item.zzmd.replace(/&#(\d+|[xX][0-9a-fA-F]+);?/g, function (_, n) {
        return n.charAt(0).toLowerCase() === 'x'
          ? String.fromCharCode(parseInt(n.substring(1), 16))
          : String.fromCharCode(+n)
      })
  } catch (error) {
    item.error = true
    item.zzmd = error.message
    console.log(error, item)
  }
  result.push(item)
})

write('gfm.json', JSON.stringify(result, null, '  '))
