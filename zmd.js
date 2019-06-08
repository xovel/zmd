/*!
 * zmd.js
 * Just a markdown parser
 * @author: xovel
 * @license: MIT
 */
;(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define('zmd', [], factory)
  } else if (typeof exports === 'object') {
    exports['zmd'] = factory()
  } else {
    root['zmd'] = factory()
  }
})(this, function () {

// -------
// Helpers

var hasOwn = Object.prototype.hasOwnProperty

// extend an object
function _extend(dest, source) {
  var ret = {}
  for (var i = 0; i < arguments.length; i++) {
    var current = arguments[i]
    for (var key in current) {
      if (hasOwn.call(current, key)) {
        ret[key] = current[key]
      }
    }
  }
  return ret
}

// traversal for an array or an object
function _each(obj, fn) {
  var i = 0
  var length = obj.length

  if (length === undefined) {
    for (i in obj) {
      if (false === fn.call(obj[i], obj[i], i)) break
    }
  } else {
    for (; i < length; i++) {
      if (false === fn.call(obj[i], obj[i], i)) break
    }
  }
  return obj
}

function _error(msg) {
  throw new Error(msg)
}

function _regex(input/*,  ...replacers */) {
  var source = input.source || input
  var flags = input.flags || ''

  for (var i = 1; i < arguments.length; i++) {
    var replacer = arguments[i]
    var name = replacer[0]
    var value = replacer[1]
    value = (value.source || value).replace(/^\^/g, '')
    source = source.replace(name, value)
  }

  return new RegExp(source, flags)
}

var escapeReplacement = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function _escape(content, entity) {
  return content.replace(entity ? /[<>"']|&(?!#?\w+;)/g : /[&<>"']/g, function (char) {
    return escapeReplacement[char]
  })
}

function _unescape(content) {
  return html.replace(/&(#(?:\d+)|(?:#x[0-9a-f]+)|(?:\w+));?/ig, function(_, n) {
    n = n.toLowerCase()
    if (n === 'colon') return ':'
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1))
    }
    return ''
  })
}

// Helpers End
// -----------

// ----------------
// Global variables

function Slugger() {
  this.slugs = Object.create(null)
}

Slugger.prototype.get = function (value) {
  var id = value.toLowerCase().trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    // .replace(/[【】｛｝（），。？：‘’“”～！、《》￥…—]/g, '-')
    .replace(/\s/g, '-')
  if (this.slugs[id]) {
    id += '-' + this.slugs[id]++
  } else {
    this.slugs[id] = 1
  }
  return id
}

function Refs() {
  this.refs = Object.create(null)
}

Refs.prototype.get = function (text, value) {
  var key = text.toLowerCase()
  if (!this.refs[key]) {
    this.refs[key] = value
  }
  return this.refs[key]
}

var commonRe = {
  // space: /\u0020/,
  // // whitespace: /\s+/,
  // // whitespace: /[ \t\n\v\f\r]+/,
  // whitespace: /[\u0020\u0009\u000a\u000b\u000c\u000d]+/, // is a space (U+0020), tab (U+0009), newline (U+000A), line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D).
  punctuation: /[!"#$%&'()*+,\-./\u0021-\u002f:;<=>?@\u003a-\u0040\[\\\]^_`\u005b-\u0060{|}~\u007b-\u007e]/, // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., / (U+0021–2F), :, ;, <, =, >, ?, @ (U+003A–0040), [, \, ], ^, _, ` (U+005B–0060), {, |, }, or ~ (U+007B–007E).

  tagname: /[a-zA-Z][\w-]*/, // A tag name consists of an ASCII letter followed by zero or more ASCII letters, digits, or hyphens (-).
  attribute: /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*([^\s"'=<>`]+|'[^']*'|"[^"]*"))?/,
  opentag: /<tagname(?:attribute)*?\s*\/?>/,
  closingtag: /<\/tagname\s*>/,
  comment: /<!--(?!-?>)[\s\S]*?[^-]-->/,
  processing: /<\?[\s\S]*?\?>/,
  declaration: /<![A-Z]+\s+[^>]+>/,
  cdata: /<!\[CDATA\[[\s\S]+?\]\]>/,
  tag: /address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul/,

  label: /\[((?!\s*\])(?:\\[\[\]]|[^\[\]])+)\]/,
  // label: /\[((?!\s*\])(?:\\[\[\]]|[^\[\]]|\[[^\[\]]*\])+)\]/,
  destination: /<([^\n<>]*)>|((?!<)(?:\\[()]|\([^)\s]*\)|[^()\s])+)/,
  // title: /"((?:\\"|[^"])*)"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\(((?:[^()]|(?:\([^)]*\)))+)\)/,
  title: /"((?:(?:(?:\\"|[^"])*)|[^"\n]*(?:\n[^"\n]+)*\n?)+)"|'((?:(?:(?:\\'|[^'])*)|[^'\n]*(?:\n[^'\n]+)*\n?)+)'|\(((?:[^()]|(?:\([^)]*\)))+)\)/,

  dcell: / *:? *-+ *:? */,
  delimiter: /(?:(?:dcell)?\|(?:(?:dcell)\|)*?(?:dcell)\|?|\|?(?:dcell)(?:(?:dcell)\|)*?\|(?:dcell)?)/,

  marker: /[*+-]|\d{1,9}[.)]/,

  scheme: /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/,
  uri: /scheme:[\s\x00-\x1f<>]*/,
  // https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type%3Demail)
  email: /[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/,
  autoemail: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/
}

var blockRe = {
  // Leaf blocks
  hr: /^ {0,3}([-*_])( *\1){2,} *(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6}) +([^\n]*?) *#* *(?:\n+|$)/,
  // setext heading
  sheading: /^((?:[^\n]*[^ \n][^\n]*\n)+) {0,3}(=+|-+) *(?:\n+|$)/,
  code: /^( {4}[^\n]+\n*)+/,
  fence: /^ {0,3}(([~`])\2{2,})([^`\n]*)\n([\s\S]*?)(?: {0,3}\1\2* *(?:\n+|$)|$)/,
  html: /^ {0,3}(?:<(script|pre|style)[^>\n]*>[\s\S]*?(?:<\/\1>[^\n]*(?:\n+|$)|$)|(?:<!--[\s\S]*?-->|processing|<![\s\S]*?>|cdata)(?:[^\n]*\n+|$)|<\/?(tag)(?: +|\n|\/?)>[\s\S]*?(?:\n{2,}|$)|(?:<(?!script|pre|style)(?:tagname)(?:attribute)*?\s*\/?>|closingtag)[\s\S]*?(?:\n{2,}|$))+/i,

  ref: /^ {0,3}(?:label): *\n? *(?:destination) *\n? *(?:\s(?:title))? *(?:\n+|$)/,
  // footnote: /^ {0,3}(?:label): ?([\S\s]+?)(?=(?:label)|\n{2,}|$)/,
  footnote: /^ {0,3}(?:label): *([^ \n][^n]*(?:\n|$))/,

  paragraph: /^([^\n]+(?:\n(?!hr|heading|sheading| {0,3}(>|(`{3}|~{3})([^`\n]*)\n)|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  newline: /^\n+/,
  text: /^[^\n]+/,
  table: /^([^\n]+)\n(delimiter) *\n((?:[^\n]+\n)*|$)/,

  formula: /^ {0,3}(\${2,})([\s\S]*?) {0,3}\1 *(?:\n+|$)/,
  deflist: /^ {0,3}([^ \n][^\n]*)\n((?::[^\n]+(?:\n+|$))+)/,
  // deflist2: /^ {0,3}:[^\n]+\n( {2,}[^\n]+(?:\n|$))+/,

  // Container blocks
  div: /^ {0,3}(:{3,})([^\n]*)\n([\s\S]*?) {0,3}\1:* *(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3})(marker) [\s\S]+?(?:\n+(?=\1?hr)|\n+(?=ref)|\n{2,}(?! )(?!\1(?:marker) )\n*|\s*$)/,
  item: /^( *)(?:marker) ?[^\n]*(?:\n(?!\1(?:marker) ?)[^\n]*)*/gm,

  raw: /^ {0,3}\{(%)? *raw *\1\} *\n([\s\S]*?) {0,3}\{\1 *endraw *\1\}(?:\n+|$)/
}

var inlineRe = {
  escape: /^\\(punctuation)/,

  br: /^( {2,}|\\)\n(?!\s*$)/, // hard break
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,

  autolink: /^<(uri|email)>/,
  autourl: /^((?:(?:ht|f)tps?:\/\/|www\.)(?:[\w-]+\.?)+[^\s<]*|email)/i,

  strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
  em: /^_([^\s_])_(?!_)|^\*([^\s*<\[])\*(?!\*)|^_([^\s<][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_<][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s<"][\s\S]*?[^\s\*])\*(?!\*|[^\spunctuation])|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,

  del: /^~~[^~]*?~~/,
  ins: /^\+\+[^+]*?\+\+/,
  mark: /^==[^=]*?==/,
  sub: /^~[^ ~\n]~/,
  sup: /^\^[^ \^\n]\^/,
  formula: /^\$[^\n\$]\$/,

  link: /^!?(?:label)\(\s*(?:destination)(?:\s+(title))?\s*\)/,
  reflink: /^!?(?:label)\[(?!\s*\])((?:\\[\[\]]|[^\[\]])+)\]/,
  nolink: /^!?(?:label)(?:\[\s*\])?/,
  footnote: /^(?:label)(?!\[)/,

  html: /^(opentag|closingtag|comment|processing|declaration|cdata)/,

  // text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*^]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*~^]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
}

commonRe.opentag = _regex(
  commonRe.opentag,
  ['tagname', commonRe.tagname],
  ['attribute', commonRe.attribute]
)
commonRe.closingtag = _regex(
  commonRe.closingtag,
  ['tagname', commonRe.tagname]
)
commonRe.delimiter = _regex(
  commonRe.delimiter,
  [/dcell/g, commonRe.dcell]
)
commonRe.uri = _regex(
  commonRe.uri,
  ['scheme', commonRe.scheme]
)

blockRe.html = _regex(
  blockRe.html,
  ['processing', commonRe.processing],
  ['cdata', commonRe.cdata],
  ['tagname', commonRe.tagname],
  ['attribute', commonRe.attribute],
  ['closingtag', commonRe.closingtag],
  ['tag', commonRe.tag]
)
blockRe.ref = _regex(
  blockRe.ref,
  ['label', commonRe.label],
  ['destination', commonRe.destination],
  ['title', commonRe.title]
)
blockRe.paragraph = _regex(
  blockRe.paragraph,
  ['hr', blockRe.hr],
  ['heading', blockRe.heading],
  ['sheading', blockRe.sheading],
  ['tag', commonRe.tag]
)
blockRe.table = _regex(
  blockRe.table,
  ['delimiter', commonRe.delimiter]
)
blockRe.blockquote = _regex(
  blockRe.blockquote,
  ['paragraph', blockRe.paragraph]
)
blockRe.list = _regex(
  blockRe.list,
  [/marker/g, commonRe.marker],
  ['hr', _regex(blockRe.hr, [
    '\\1', '\\2'
  ], [
    ' {0,3}', ''
  ])],
  ['ref', _regex(blockRe.ref, [
    ' {0,3}', ''
  ])]
)
blockRe.bullet = _regex(/^ *(marker) */, [
  'marker', commonRe.marker
])
blockRe.item = _regex(
  blockRe.item,
  [/marker/g, commonRe.marker]
)
blockRe.footnote = _regex(
  blockRe.footnote,
  ['label', commonRe.label],
  ['\\[', '\\[\\^'],
  ['label', commonRe.label]
)

inlineRe.escape = _regex(
  inlineRe.escape,
  ['punctuation', commonRe.punctuation]
)
inlineRe.autolink = _regex(
  inlineRe.autolink,
  ['uri', commonRe.uri],
  ['email', commonRe.email]
)
inlineRe.autourl = _regex(
  inlineRe.autourl,
  ['email', commonRe.email]
)
inlineRe.strong = _regex(
  inlineRe.strong,
  [/punctuation/g, commonRe.punctuation]
)
inlineRe.link = _regex(
  inlineRe.link,
  ['label', commonRe.label],
  ['destination', commonRe.destination],
  ['title', commonRe.title]
)
inlineRe.reflink = _regex(
  inlineRe.reflink,
  ['label', commonRe.label]
)
inlineRe.nolink = _regex(
  inlineRe.nolink,
  ['label', commonRe.label]
)
inlineRe.footnote = _regex(
  inlineRe.footnote,
  ['label', commonRe.label],
  ['\\[', '\\[\\^']
)
inlineRe.html = _regex(
  inlineRe.html,
  ['opentag', commonRe.opentag],
  ['closingtag', commonRe.closingtag],
  ['comment', commonRe.comment],
  ['processing', commonRe.processing],
  ['declaration', commonRe.declaration],
  ['cdata', commonRe.cdata]
)

function Lexer(options){
  this.tokens = []
  this.tokens.footnote = []
  this.tokens.fnrefs = Object.create(null) // {}
  this.tokens.refs = Object.create(null) // {}
  this.options = options
  this.rules = blockRe
}

Lexer.rules = blockRe

Lexer.lex = function (src, options) {
  var lexer = new Lexer(options)
  return lexer.lex(src)
}

Lexer.prototype.lex = function (src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n')

  return this.parse(src, true)
}

Lexer.prototype.parse = function (src, top) {
  src = src.replace(/^ +$/gm, '')

  var cap
  var match
  var item
  var i
  var j
  var n
  var bqCount
  var bqText
  var loose
  var next
  var prefix
  var listOpen
  var listText
  var listItems
  var listType

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length)
    }

    // raw
    if (cap = this.rules.raw.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'raw',
        text: cap[2]
      })
      continue
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length)
      // cannot interrupt a paragraph
      var prevToken = this.tokens.slice(-1)[0]
      if (prevToken && prevToken.type === 'paragraph') {
        prevToken.text += '\n' + cap[0].replace(/\s+$/, '')
        // cap[0].trimEnd()
      } else {
        this.tokens.push({
          type: 'code',
          text: cap[0].replace(/^ {4}/gm, '').replace(/\n+$/, '')
        })
      }
      continue
    }

    // fence
    if (cap = this.rules.fence.exec(src)) {
      src = src.substring(cap[0].length)
      match = (cap[3] || '').match(/\s*([^\s]*)\s*(?:\{([^}]+)\})?/)
      cap = cap[4] || ''
      this.tokens.push({
        type: 'fence',
        lang: match[1],
        lines: getHLines(match[2], cap),
        text: cap
      })
      continue
    }

    // table
    if (cap = this.rules.table.exec(src)) {
      item = {
        type: 'table',
        header: splitTableRow(cap[1].replace(/^ *\|?|\|? *$/g, '')),
        align: cap[2].replace(/^ *\|?|\|? *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n+$/, '').split('\n') : []
      }

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length)

        for (i = 0; i < item.align.length; i++) {
          if (/^ *: *-+ *$/.test(item.align[i])) {
            item.align[i] = 'left'
          } else if (/^ *: *-+ *: *$/.test(item.align[i])) {
            item.align[i] = 'center'
          } else if (/^ *-+ *: *$/.test(item.align[i])) {
            item.align[i] = 'right'
          } else {
            item.align[i] = null // ''
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitTableRow(item.cells[i], item.header.length)
        }

        this.tokens.push(item)
        continue
      }
    }

    // div
    if (cap = this.rules.div.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'div_open',
        kls: cap[2] || ''
      })

      // recurse
      this.parse(cap[0], top)

      this.tokens.push({
        type: 'div_close'
      })
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'blockquote_open'
      })

      bqText = cap[0].replace(/^ *> ?/gm, '')

      // laziness
      bqCount = 1
      while (/^ {0,3}>/.test(bqText)) {
        bqCount++
        this.tokens.push({
          type: 'blockquote_open'
        })
        bqText = bqText.replace(/^ *> ?/gm, '')
      }

      // recurse
      this.parse(bqText, top)

      for (i = 0; i < bqCount; i++) {
        this.tokens.push({
          type: 'blockquote_close'
        })
      }
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length)
      listOpen = {
        type: 'list_open',
        start: parseInt(cap[2], 10) || 0,
        loose: false
      }
      this.tokens.push(listOpen)

      cap = cap[0].match(this.rules.item)
      n = cap.length
      listItems = []
      next = false
      listType = []

      for (i = 0; i < n; i++) {
        listText = cap[i]
        prefix = listText.length
        listText = listText.replace(blockRe.bullet, function (_, bullet) {
          listType[i] = bullet[bullet.length - 1]
          return ''
        })
        prefix -= listText.length

        // Changing the bullet or ordered list delimiter starts a new list
        if (
          i > 0
          && listType[i - 1] !== listType[i]
        ) {

          if (listOpen.loose) {
            for (j = 0; j < listItems.length; j++) {
              listItems[j].loose = true
            }
          }
          this.tokens.push({
            type: 'list_close'
          })
          this.tokens.push({
            type: 'list_open'
          })
          listItems = []
          next = false
        }
        // loose or tight
        loose = next || /\n\n(?!\s*$)/.test(listText)
        if (i !== n - 1) {
          next = listText.charAt(listText.length - 1) === '\n'
          if (!loose) loose = next
        }

        if (loose) {
          listOpen.loose = true
        }

        item = {
          type: 'item_open',
          task: /^\[[ x]\]/i.test(listText)
        }

        if (item.task) {
          item.checked = listText[1] !== ' '
          listText = listText.replace(/^\[[ x]\] +/i, '')
        }

        listItems.push(item)
        this.tokens.push(item)

        // recurse
        this.parse(listText.replace(new RegExp('^ {2,' + prefix + '}', 'gm'), ''), false)

        this.tokens.push({
          type: 'item_close'
        })
      }

      if (listOpen.loose) {
        for (i = 0; i < listItems.length; i++) {
          listItems[i].loose = true
        }
      }

      this.tokens.push({
        type: 'list_close'
      })
      continue
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'hr'
      })
      continue
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'heading',
        level: cap[1].length,
        text: cap[2]
      })
      continue
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'html',
        text: cap[0]
      })
      continue
    }

    // footnote
    if (cap = this.rules.footnote.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'footnote',
        name: cap[1],
        text: cap[2]
      })
      continue
    }

    // formula
    if (this.options.formula && (cap = this.rules.formula.exec(src))) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'formula',
        text: cap[2]
      })
      continue
    }

    // ref
    if (top && (cap = this.rules.ref.exec(src))) {
      src = src.substring(cap[0].length)
      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1)
      tag = cap[1].toLowerCase().replace(/\s+/g, ' ')
      if (!this.tokens.refs[tag]) {
        this.tokens.refs[tag] = {
          href: cap[2],
          title: cap[3]
        }
      }
      continue
    }

    // setext heading
    if (cap = this.rules.sheading.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'heading',
        level: cap[2][0] === '-' ? 2 : 1,
        text: cap[1]
      })
      continue
    }

    // definition list
    if (cap = this.rules.deflist.exec(src)) {
      src = src.substring(cap[0].length)
      item = {
        type: 'deflist',
        dt: cap[1],
        dd: cap[2].replace(/\n+$/, '').split('\n')
      }
      for (i = 0; i < item.dd.length; i++) {
        item.dd[i] = item.dd[i].replace(/^: */, '')
      }
      this.tokens.push(item)
      continue
    }

    // paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].replace(/\n+$/, '')
      })
      continue
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'text',
        text: cap[0]
      })
      continue
    }

    if (src) {
      _error('Unrecognized byte:' + src.charCodeAt(0))
    }

  }

  return this.tokens
}

function getHLines(text, code) {
  var ret = []
  if (text) {
    var lines = code.split('\n').length
    str.split(',').map(function (item) {
      if (item.indexOf('-') !== -1) {
        var nn = item.split('-')
        for (var i = +nn[0]; i <= +nn[1] && i <= lines; i++) {
          ret.push(i)
        }
      } else {
        var n = +item
        if (n && n <= lines) {
          ret.push(n)
        }
      }
    })
  }
  return ret
}

function splitTableRow(text, limit) {
  text = text.replace(/\\\|/g, '\t').split(/ *\| */)
  var result = []
  var length = limit || text.length
  for (var i = 0; i < length; i++) {
    result.push(text[i] ? text[i].replace(/\t/g, '|') : '')
  }
  return result
}

function Renderer(options) {
  this.options = options
}

Renderer.prototype.hr = function () {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n'
}

Renderer.prototype.br = function () {
  return this.options.xhtml ? '<br/>\n' : '<br>\n'
}

Renderer.prototype.heading = function (text, level, raw, slugger) {
  return '<h'
    + level
    + (this.options.headerIds ? this.options.headerPrefix + slugger.get(raw) : '')
    + '>'
    + text
    + '</h'
    + level
    + '>\n'
}

Renderer.prototype.code = function (code) {
  return '<pre><code>' + _escape(code) + '</code></pre>'
}

Renderer.prototype.fence = function (code, lang, hLines) {
  var escaped
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang)
    if (out && out !== code) {
      code = out
      escaped = true
    }
  }

  var out = '<pre><code class="'
    + this.options.langPrefix
    + _escape(lang, true)
    + '">'
    + (escaped ? code : _escape(code))
    + '</code></pre>\n'


  if (hLines && hLines.length > 0) {
    var wrap = ''
    wrap = '<div class="code-hl">\n'
    for (var i = 0; i < hLines.length; i++) {
      wrap += '<div class="code-hl-item" style="top:"'
      wrap += ((hLines - 1) * 20 + 16)
      wrap += 'px"></div>\n'
    }

    out = wrap + out + '</div>'
  }

  return out
}

Renderer.prototype.html = function (html) {
  return html
}

Renderer.prototype.footnote = function (footnotes) {
  var result = '<hr class="footnote-sep"' + (this.options.xhtml ? '/' : '') + '>\n'
  result += '<ol class="footnote-list">'
  for (var i = 0; i < footnotes.length; i++) {
    var index = i + 1
    result += '<li id="fn"'
      + index
      + ' class="footnote-item"><p>'
      + footnotes[i]
      + '<a class="footnote-backref" href="#fnref"'
      + index
      + '>↩</a></p></li>'
  }
  result += '</ol>'
  return result
}

Renderer.prototype.text = function (text) {
  return text
}

Renderer.prototype.table = function (header, body) {
  if (body) body = '<tbody>' + body + '</tbody>'
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + body
    + '</table>\n'
}

Renderer.prototype.tablecell = function (content, tag, align) {
  return '<'
    + tag
    + (align ? ' align="' + align + '"' : '')
    + '>'
    + content
    + '</'
    + tag
    + '>\n'
}

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n'
}

Renderer.prototype.formula = function (content) {
  return '<div class="formula">\n' + content + '</div>\n'
}

Renderer.prototype.inlineFormula = function (text) {
  return '<span class="formula">' + text + '</span>'
}

Renderer.prototype.div = function (content, kls) {
  return '<div class="' + kls + '">\n' + content + '</div>\n'
}

Renderer.prototype.list = function (content, start) {
  var tag = start > 0 ? 'ol' : 'ul'
  var order = start > 1 ? (' start="' + start +'"') : ''
  return '<' + tag + order + '>\n' + content + '</' + tag + '>\n'
}

var blockTags = [
  'li',
  'dl',
  'dt',
  'dd',
  'p'
]

var inlineTags = [
  'strong',
  'em',
  'ins',
  'mark',
  'del',
  'sub',
  'sup'
]

for (var i = 0; i < blockTags.length; i++) {
  var name = blockTags[i]
  Renderer.prototype[name] = function (content) {
    return '<' + name + '>' + content + '</' + name + '>\n'
  }
}

Renderer.prototype.blockquote = function(content) {
  return '<blockquote>\n' + content + '</blockquote>\n'
}

Renderer.prototype.paragraph = Renderer.prototype.p

for (var i = 0; i < inlineTags.length; i++) {
  var name = inlineTags[i]
  Renderer.prototype[name] = function (text) {
    return '<' + name + '>' + text + '</' + name + '>'
  }
}

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>'
}

Renderer.prototype.link = function (href, text, title) {
  return '<a href="'
    + _escape(href)
    + '"'
    + (title ? ' title="' + title + '"' : '')
    + '>'
    + text
    + '</a>'
}

Renderer.prototype.image = function (src, text, title) {
  return '<img src="'
    + src
    + '" alt="'
    + text
    + '"'
    + (title ? ' title="' + title + '"' : '')
    + (this.options.xhtml ? '/>' : '>')
}

function Parser(options) {

}


var zmd = function (content, options, callback) {

  if (!content) {
    _error('Need content');
  }

  options = _extend({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    sanitizer: null,
    mangle: true,
    smartLists: false,
    taskList: false,
    silent: false,
    highlight: null,
    langPrefix: 'lang-',
    smartypants: false,
    headerPrefix: '',
    xhtml: false
  }, options || {});

  // 第一步：词法解析
  var lexer = new Lexer(content, options);





}




zmd.tokens = [];

zmd.lex = function(src){
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  src = src.replace(/^ +$/gm, '');

  var temp;

  while(src){

    if(temp = zmd.block.newline.exec(src)){
      src = src.substring(temp[0].length);
      if(temp[0].length > 1){
        zmd.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (temp = zmd.block.code.exec(src)) {
      src = src.substring(temp[0].length);
      temp = temp[0].replace(/^ {4}/gm, '');
      zmd.tokens.push({
        type: 'code',
        text: temp
      });
      continue;
    }

    break;

  }

  return zmd
}

zmd.getSlug = getSlug
zmd.getRef = getRef

zmd.commonRe = commonRe
zmd.blockRe = blockRe
zmd.inlineRe = inlineRe

zmd.Lexer = Lexer

return zmd

})
