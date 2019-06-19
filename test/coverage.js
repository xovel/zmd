'use strict'

const fs = require('fs')
const path = require('path')

const diff = require('./diff.json')

const table = []

table.push('> Test time: ' + new Date().toString())
table.push('\n')

table.push('| Section | Total | Pass | Diff | Percentage |')
table.push('| ------- | ----- | ---- | ---- | ---------- |')

for (let key in diff._) {
  let v = diff._[key]
  table.push(`| ${key} | ${v.total} | ${v.pass} | ${v.diff} | ${v.percent} |`)
}

table.push('\n')

write('coverage.md', table.join('\n'))

function write(filepath, content) {
  fs.writeFileSync(path.join(__dirname, filepath), content)
}
