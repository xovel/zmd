'use strict'

const fs = require('fs')

const json = []

const content = fs.readFileSync('./gfm.html').toString()

const sections = content.split('<a href="#TOC" class="toc-link"></a><span class="number">')

sections.shift()

sections.forEach(section => {

const titleStart = section.indexOf('</span>')
const titleEnd = section.indexOf('</h2>', titleStart)
const name = _back(section.substring(titleStart + 7, titleEnd)).trim()

const list = section.split('<div class="example"')

list.shift()

if (list.length === 0) {
  return;
}

const CODE_START_TEXT = '<pre><code class="language-markdown">'
const CODE_END_TEXT = '</code></pre>'
const HTML_START_TEXT = '<pre><code class="language-html">'
const HTML_END_TEXT = '</code></pre>'

list.forEach(item => {
  const example = parseFloat(item.substr(13, 4))
  const codeStart = item.indexOf(CODE_START_TEXT)
  const codeEnd = item.indexOf(CODE_END_TEXT, codeStart)
  const markdown = _back(item.substring(codeStart + CODE_START_TEXT.length, codeEnd))
  const htmlStart = item.indexOf(HTML_START_TEXT, codeEnd)
  const htmlEnd = item.indexOf(HTML_END_TEXT, htmlStart)
  const html = _back(item.substring(htmlStart + HTML_START_TEXT.length, htmlEnd))

  const cur = {
    markdown, html, example, section: name
  }

  json.push(cur)
})

})

function _back(text) {
  let ret = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/→/g, '\t')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')

  while (ret.indexOf('<span class="space"> </span>') !== -1) {
    ret = ret.replace('<span class="space"> </span>', ' ')
  }

  return ret
}

fs.writeFileSync('gfm.json', JSON.stringify(json, null, '  '))
