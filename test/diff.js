'use strict'

const fs = require('fs')
const path = require('path')

const gfm = require('./gfm.json')

const diff = {
  _: {}
}

// function read(name) {
//   return fs.readFileSync(path.join(__dirname, name)).toString()
// }

function write(filepath, content) {
  fs.writeFileSync(path.join(__dirname, filepath), content)
}

function _set(name, value, same) {
  const count = diff._
  if (count[name]) {
    count[name].total++
  } else {
    count[name] = {
      total: 1,
      diff: 0,
      same: 0
    }
  }
  if (same) {
    count[name].same++
  } else {
    count[name].diff++
    if (count[name].diffList) {
      count[name].diffList.push(value.example)
    } else {
      count[name].diffList = [value.example]
    }
    if (diff[name]) {
      diff[name].push(value)
    } else {
      diff[name] = [value]
    }
  }
  count[name].percent = ((count[name].same / count[name].total) * 100).toFixed(2) + '%'

}

gfm.forEach(item => {
  const {section, ...value} = item
  _set(section, value, item.html === item.zzmd)
})

write('diff.json', JSON.stringify(diff, null, '  '))

const table = []

table.push('> Test time: ' + new Date().toString())
table.push('\n')

table.push('| Section | Total | Pass | Diff | Percentage |')
table.push('| ------- | ----- | ---- | ---- | ---------- |')

for (let key in diff._) {
  let v = diff._[key]
  table.push(`| ${key} | ${v.total} | ${v.same} | ${v.diff} | ${v.percent} |`)
}

table.push('\n')

write('coverage.md', table.join('\n'))
