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

var hasOwn = Object.prototype.hasOwnProperty

// extend an object
function _extend(dest, source) {
  var ret = {}
  for (var i = 0; i < arguments.length; i++) {
    var current = arguments[i]
    if (current) {
      for (var key in current) {
        if (hasOwn.call(current, key)) {
          ret[key] = current[key]
        }
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

function _regex(input/* ,  ...replacers */) {
  var source = input.source || input
  var flags = input.flags || ''

  for (var i = 1; i < arguments.length; i++) {
    var replacer = arguments[i]
    var name = replacer[0]
    var value = replacer[1]
    value = (value.source || value).replace(/^\^/, '')
    source = source.replace(name, value)
  }

  return new RegExp(source, flags)
}

var escapeReplacement = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;' // eslint-disable-line quotes
}

function _escape(content, entity) {
  return content.replace(entity ? /[<>"']|&(?!#?\w+;)/g : /[&<>"']/g, function (char) {
    return escapeReplacement[char]
  })
}

function _unescape(content) {
  return content.replace(/&(#(?:\d+)|(?:#x[0-9a-f]+)|(?:\w+));?/ig, function (_, n) {
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

function _trim(text) {
  return text ? String.prototype.trim ?
    String.prototype.trim.call(text) :
    text.replace(/^\s+|\s+$/g, '') : ''
}

var commonRe = {
  // space: /\u0020/,
  // // whitespace: /\s+/,
  // // whitespace: /[ \t\n\v\f\r]+/,
  // whitespace: /[\u0020\u0009\u000a\u000b\u000c\u000d]+/, // is a space (U+0020), tab (U+0009), newline (U+000A), line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D).
  punctuation: /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g,
  // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., / (U+0021–2F)
  // :, ;, <, =, >, ?, @ (U+003A–0040)
  // [, \, ], ^, _, ` (U+005B–0060)
  // {, |, }, or ~ (U+007B–007E)

  tagname: /[a-zA-Z][\w-]*/, // A tag name consists of an ASCII letter followed by zero or more ASCII letters, digits, or hyphens (-).
  attribute: /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*([^\s"'=<>`]+|'[^']*'|"[^"]*"))?/,
  // inline attribute
  _attribute: / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/,
  opentag: /<tagname(?:attribute)*?\s*\/?>/,
  closingtag: /<\/tagname\s*>/,
  comment: /<!--(?!-?>)[\s\S]*?[^-]-->/,
  processing: /<\?[\s\S]*?\?>/,
  declaration: /<![A-Z]+\s+[^>]+>/,
  cdata: /<!\[CDATA\[[\s\S]+?\]\]>/,
  tag: /address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul/,

  label: /\[((?:\[[^[\]]*\]|\\[[\]]?|`[^`]*`|`(?!`)|[^[\]\\`])*?)\]/,
  // footnote, ref
  _label: /\[((?!\s*\])(?:\\[[\]]|[^[\]])+)\]/,
  // label: /\[((?!\s*\])(?:\\[\[\]]|[^\[\]]|\[[^\[\]]*\])+)\]/,
  destination: /<([^\n<>]*)>|((?!<)(?:\\[()]|\([^)\s]*\)|[^()\s])+)/,
  // title: /"((?:\\"|[^"])*)"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\(((?:[^()]|(?:\([^)]*\)))+)\)/,
  title: /"((?:(?:(?:\\"|[^"])*)|[^"\n]*(?:\n[^"\n]+)*\n?)+)"|'((?:(?:(?:\\'|[^'])*)|[^'\n]*(?:\n[^'\n]+)*\n?)+)'|\(((?:[^()]|(?:\([^)]*\)))+)\)/,

  dcell: / *:? *-+ *:? */,
  delimiter: /(?:(?:dcell)?\|(?:(?:dcell)\|)*?(?:dcell)\|?|\|?(?:dcell)(?:(?:dcell)\|)*?\|(?:dcell)?)/,

  marker: /[*+-]|\d{1,9}[.)]/,

  scheme: /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/,
  uri: /scheme:[^\s\x00-\x1f<>]*/,
  // https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type%3Demail)
  email: /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/,
  autoemail: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/
}

var blockRe = {
  // Leaf blocks
  hr: /^ {0,3}([*_-])(?: *\1){2,} *(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6})(?: ([^\n]*?)(?: #* *)?)?(?:\n+|$)/,
  // setext heading
  sheading: /^( {0,3}[^ \n][^\n]*(?:\n[^\n]+)*?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  code: /^ {4}[^\n]*((?: {4}[^\n]*| {0,3})(?:\n|$))+/,
  fence: /^( {0,3})(([~`])\3{2,})([^\n]*)([\s\S]*?)(\n {0,3}\2\3* *(?:\n+|$)|$)/,
  // [^>\n]*> -> [\s>] to support linebreak
  html: /^ {0,3}(?:<(script|pre|style)[^>\n]*>[\s\S]*?(?:<\/\1>[^\n]*\n+|$)|<!--[\s\S]*?-->|(?:processing|<![\s\S]*?>|cdata)\n*|<\/?(tag)(?: +|\n|\/?)>[\s\S]*?(?:\n{2,}|$)|(?:<(?!script|pre|style)(?:tagname)(?:attribute)*? *\/?>|<\/(?!script|pre|style)(?:tagname)\s*>)(?= *(?:\n|$))[\s\S]*?(?:\n{2,}|$))/i,

  ref: /^ {0,3}(?:label): *\n? *(?:destination) *\n? *(?:\s(?:title))? *(?:\n+|$)/,
  // footnote: /^ {0,3}(?:label): ?([\S\s]+?)(?=(?:label)|\n{2,}|$)/,
  footnote: /^ {0,3}(?:label): *([^ \n][^\n]*(?:\n|$))/,

  paragraph: /^([^\n]+(?:\n(?!hr|heading|sheading| {0,3}(>|[*+-] +[^ \n]|1[.)] +[^ \n]|(`{3}|~{3})([^\n]*)(?:\n|$))|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  newline: /^(?: *\n)+/,
  text: /^[^\n]+/,
  table: /^([^\n]+)\n(delimiter)(?: *\n((?:(?!\n| {4,}| {0,3}(?:>|`{3}|~{3}|([_*-]) *\4{2,} *(?:\n|$)|(?:#{1,6}|[*+-]|\d{1,9}[.)])(?: |\n|$)))[^\n]*(?:\n|$))*)|$)/,

  deflist: /^ {0,3}([^ \n][^\n]*)\n((?::[^\n]+(?:\n+|$))+)/,
  // deflist2: /^ {0,3}:[^\n]+\n( {2,}[^\n]+(?:\n|$))+/,

  // Container blocks
  div: /^ {0,3}(:{3,})([^\n]*)\n([\s\S]*?) {0,3}\1:* *(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3})(marker) [\s\S]+?(?:\n+(?=\1?hr)|\n+(?=ref)|\n{2,}(?! )(?!\1(?:marker) )\n*|\s*$)/,
  item: /^( *)(?:marker) ?[^\n]*(?:\n(?!\1 ?(?:marker) ?)[^\n]*)*/gm,

  raw: /^ {0,3}\{(%)? *raw *\1\} *\n([\s\S]*?) {0,3}\{\1 *endraw *\1\} *(?:\n+|$)/
}

var inlineRe = {
  escape: /^\\(punctuation)/,

  br: /^( {2,}|\\)\n(?!\s*$)/, // hard break
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,

  autolink: /^<(uri|email)>/,
  autourl: /^((?:(?:ht|f)tps?:\/\/|www\.)(?:[\w-]+\.?)+[^\s<]*|email)/i,

  strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
  em: /^_([^\s_])_(?!_)|^\*([^\s*<[])\*(?!\*)|^_([^\s<][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_<][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s<"][\s\S]*?[^\s*])\*(?!\*|[^\spunctuation])|^\*([^\s*"<[][\s\S]*?[^\s])\*(?!\*)/,

  del: /^~~([\s\S]+?)~~/,
  ins: /^\+\+([\s\S]+?)\+\+/,
  mark: /^==([\s\S]+?)==/,
  sub: /^~([^~\n]+)~/,
  sup: /^\^([^^\n]+)\^/,

  link: /^!?(?:label)\(\s*(?:(?:destination)(?:\s+(?:title))?)?\s*\)/,
  reflink: /^!?(?:label)\[(?!\s*\])((?:\\[[\]]|[^[\]])+)\]/,
  nolink: /^!?(?:label)(?:\[\s*\])?/,
  footnote: /^(?:label)(?!\[)/,

  html: /^(<tagname(?:attribute)*? *\/?>|closingtag|comment|processing|declaration|cdata)/,

  // text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*^]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<![`*~^$+=]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+/=?_`{|}~-](?=[a-zA-Z0-9.!#$%&'*+/=?_`{|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+/=?_`{|}~-]+@))/
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
  [/tagname/g, commonRe.tagname],
  ['attribute', commonRe._attribute],
  ['closingtag', commonRe.closingtag],
  ['tag', commonRe.tag]
)
blockRe.ref = _regex(
  blockRe.ref,
  ['label', commonRe._label],
  ['destination', commonRe.destination],
  ['title', commonRe.title]
)
blockRe.paragraph = _regex(
  blockRe.paragraph,
  ['hr', blockRe.hr],
  ['\\1', '\\2'],
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
    '\\1', '\\3'
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
  ['label', commonRe._label],
  ['\\[', '\\[\\^'],
  ['label', commonRe.label]
)

inlineRe.escape = _regex(
  inlineRe.escape,
  ['punctuation', commonRe.punctuation]
)
inlineRe._escape = _regex(
  /\\(punctuation)/g,
  ['punctuation', commonRe.punctuation]
)
inlineRe.autolink = _regex(
  inlineRe.autolink,
  ['uri', commonRe.uri],
  ['email', commonRe.email],
  ['@', '(@)']
)
inlineRe.autourl = _regex(
  inlineRe.autourl,
  ['email', commonRe.autoemail]
)
inlineRe.em = _regex(
  inlineRe.em,
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
  ['label', commonRe.label],
  ['*?', '+?']
)
inlineRe.footnote = _regex(
  inlineRe.footnote,
  ['label', commonRe._label],
  ['\\[', '\\[\\^']
)
inlineRe.html = _regex(
  inlineRe.html,
  ['tagname', commonRe.tagname],
  ['attribute', commonRe._attribute],
  ['closingtag', commonRe.closingtag],
  ['comment', commonRe.comment],
  ['processing', commonRe.processing],
  ['declaration', commonRe.declaration],
  ['cdata', commonRe.cdata]
)

function Slugger() {
  this.slugs = Object.create(null)
}

Slugger.prototype.get = function (value) {
  var id = _unescape(_trim(value)).toLowerCase()
    .replace(commonRe.punctuation, '')
    .replace(/\s/g, '-')
  var slug = id
  while (this.slugs[slug]) {
    slug = id + '-' + this.slugs[id]++
  }
  this.slugs[slug] = 1
  return slug
}

function Lexer(options) {
  this.tokens = []
  this.tokens.fnrefs = Object.create(null) // {}
  this.tokens.refs = Object.create(null) // {}
  this.options = options || zmd.defaults
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
  if (this.options.ignoreBlankLine) {
    src = src.replace(/^ +$/gm, '')
  }

  var rules = this.rules

  var cap
  var match
  var item
  var i
  var j
  var n
  var count
  var text
  var loose
  var next
  var prefix
  var listOpen
  var listItems
  var listType

  while (src) {
    // newline
    if (cap = rules.newline.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'newline',
        lines: cap[0].split('\n').length - 1
      })
    }

    // raw
    if (cap = rules.raw.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'raw',
        text: cap[2]
      })
      continue
    }

    // code
    if (cap = rules.code.exec(src)) {
      src = src.substring(cap[0].length)
      // cannot interrupt a paragraph
      var prevToken = this.tokens.slice(-1)[0]
      if (prevToken && prevToken.type === 'paragraph') {
        prevToken.text += '\n' + cap[0].replace(/\s+$/, '')
        // cap[0].trimEnd()
      } else {
        text = cap[0].replace(/^ {0,4}/gm, '').replace(/^\n+/, '').replace(/\n+$/, '\n')
        // ignore empty line
        if (/^\n+$/.test(text)) {
          text = ''
        }
        this.tokens.push({
          type: 'code',
          text: text
        })
      }
      continue
    }

    // fence
    if (cap = rules.fence.exec(src)) {
      text = cap[5] ? cap[5].replace(/^\n/, '') : ''

      if (cap[6]) {
        text += '\n'
      }

      // ignore empty line
      if (/^\n+$/.test(text)) {
        text = ''
      } else if (cap[1]) {
        text = text.replace(cap[1].length === 1 ? /^ /gm : new RegExp('^ {1,' + cap[1].length + '}', 'gm'), '')
        // switch (cap[1].length) {
        //   case 1:
        //     text = text.replace(/^ /gm, '')
        //     break;
        //   case 2:
        //     text = text.replace(/^ {2}/gm, '')
        //     break;
        //   default:
        //     text = text.replace(/^ {3}/gm, '')
        //     break;
        // }
      }

      // Info strings for backtick code blocks cannot contain backticks
      if (!cap[4] || cap[3] === '~' || cap[4].indexOf('`') === -1) {
        match = _trim(cap[4]).split(' ')
        this.tokens.push({
          type: 'fence',
          lang: match[0] ? match[0].replace(inlineRe._escape, '$1') : '',
          meta: match.slice(1).join(' '),
          text: text
        })

        src = src.substring(cap[0].length)
        continue
      }
    }

    // table
    if (cap = rules.table.exec(src)) {
      item = {
        type: 'table',
        header: splitTableRow(cap[1]),
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
    if (cap = rules.div.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'div_open',
        kls: _trim(cap[2])
      })

      // recurse
      this.parse(cap[3], top)

      this.tokens.push({
        type: 'div_close'
      })
    }

    // hr
    if (cap = rules.hr.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'hr'
      })
      continue
    }

    // heading
    if (cap = rules.heading.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'heading',
        level: cap[1].length,
        text: cap[2] ? _trim(cap[2]) : ''
      })
      continue
    }

    // blockquote
    if (cap = rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'blockquote_open'
      })

      text = cap[0].replace(/^ *> ?/gm, '')

      // laziness
      count = 1
      while (/^ {0,3}>/.test(text)) {
        count++
        this.tokens.push({
          type: 'blockquote_open'
        })
        text = text.replace(/^ *> ?/gm, '')
      }

      // recurse
      this.parse(text, top)

      for (i = 0; i < count; i++) {
        this.tokens.push({
          type: 'blockquote_close'
        })
      }
      continue
    }

    // list
    if (cap = rules.list.exec(src)) {
      src = src.substring(cap[0].length)
      listOpen = {
        type: 'list_open',
        start: parseInt(cap[2], 10) || 0,
        loose: false
      }
      this.tokens.push(listOpen)

      cap = cap[0].match(rules.item)
      n = cap.length
      listItems = []
      next = false
      listType = []

      for (i = 0; i < n; i++) {
        text = cap[i]
        prefix = text.length
        text = text.replace(blockRe.bullet, function (_, bullet) {
          listType.bullet = bullet
          listType[i] = bullet[bullet.length - 1]
          return ''
        })

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
          listOpen = {
            type: 'list_open',
            start: parseInt(listType.bullet, 10) || 0,
            loose: false
          }
          this.tokens.push(listOpen)
          listItems = []
          next = false
        }

        // TODO: Lists
        if (~text.indexOf('\n ')) {
          prefix -= text.length
          text = text.replace(new RegExp('^ {1,' + prefix + '}', 'gm'), '')
        }

        // loose or tight
        loose = next || /\n\n(?!\s*$)/.test(text)
        if (i !== n - 1) {
          next = text.charAt(text.length - 1) === '\n'
          if (!loose) loose = next
        }

        if (loose) {
          listOpen.loose = true
        }

        item = {
          type: 'item_open',
          task: /^\[[ x]\] [^ ]/i.test(text)
        }

        if (item.task) {
          item.checked = text[1] !== ' '
          text = text.replace(/^\[[ x]\] +/i, '')
        }

        listItems.push(item)
        this.tokens.push(item)

        // recurse
        this.parse(text, false)

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

    // html
    if (cap = rules.html.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'html',
        text: cap[0].replace(/\n+$/, '\n')
      })
      continue
    }

    // footnote
    if (this.options.footnote && (cap = rules.footnote.exec(src))) {
      src = src.substring(cap[0].length)
      text = _trim(cap[1]).toLowerCase().replace(/\s+/g, ' ')
      this.tokens.fnrefs[text] = {
        text: _trim(cap[2])
      }
      continue
    }

    // ref
    if (top && (cap = rules.ref.exec(src))) {
      src = src.substring(cap[0].length)
      item = _trim(cap[1]).toLowerCase().replace(/\s+/g, ' ')
      if (!this.tokens.refs[item]) {
        this.tokens.refs[item] = {
          href: _trim(cap[2] || cap[3]),
          title: cap[4] || cap[5] || cap[6] || ''
        }
      }
      continue
    }

    // setext heading
    if (cap = rules.sheading.exec(src)) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'heading',
        level: cap[2][0] === '-' ? 2 : 1,
        text: _trim(cap[1])
      })
      continue
    }

    // definition list
    if (cap = rules.deflist.exec(src)) {
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
    if (top && (cap = rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].replace(/\s+$/, '').replace(/^\s+/gm, '')
      })
      continue
    }

    // text
    if (cap = rules.text.exec(src)) {
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

function splitTableRow(text, limit) {
  text = text
    // .replace(/\\\\/g, '\n')     // replace \\
    // .replace(/\\\|/g, '\t')     // replace \|
    // .replace(/\n/g, '\\\\')     // recover \\
    .replace(/((?:^|[^\\])(?:\\\\)*)\\\|/g, '$1\t')
    .replace(/^\||\|$/g, '')    // remove inital or trailing |
    .split('|')
  var result = []
  var length = limit || text.length
  for (var i = 0; i < length; i++) {
    result.push(text[i] ? _trim(text[i].replace(/\t/g, '|')) : '')
  }
  return result
}

function Renderer(options) {
  this.options = options || zmd.defaults
}

Renderer.prototype.hr = function () {
  return this.options.xhtml ? '<hr />\n' : '<hr>\n'
}

Renderer.prototype.br = function () {
  return this.options.xhtml ? '<br />\n' : '<br>\n'
}

Renderer.prototype.heading = function (text, level, slug) {
  return '<h'
    + level
    + (slug ? ' id="' + slug + '"' : '')
    + '>'
    + text
    + '</h'
    + level
    + '>\n'
}

Renderer.prototype.codeblock = function (code) {
  return '<pre><code>' + _escape(code) + '</code></pre>\n'
}

Renderer.prototype.fence = function (code, lang, meta, escaped) {
  var out

  if (this.options.highlight) {
    out = this.options.highlight(code, lang)
    if (out && out !== code) {
      code = out
      escaped = true
    }
  }

  out = '<pre><code'
    + (lang ? ' class="' + this.options.langPrefix + _escape(lang, true) + '"' : '')
    + '>'
    + (escaped ? code : _escape(code))
    + '</code></pre>\n'

  return out
}

Renderer.prototype.footnote = function (footnotes) {
  var result = '<hr class="footnote-sep"' + (this.options.xhtml ? ' /' : '') + '>\n'
  result += '<ol class="footnote-list">'
  for (var i = 0; i < footnotes.length; i++) {
    var index = i + 1
    result += '<li id="fn'
      + index
      + '" class="footnote-item"><p>'
      + footnotes[i]
      + '<a class="footnote-backref" href="#fnref'
      + index
      + '">↩</a></p></li>'
  }
  result += '</ol>'
  return result
}

// garbage in, garbage out
_each(['raw', 'text', 'html'], function (name) {
  Renderer.prototype[name] = function (text) {
    return text
  }
})

Renderer.prototype.table = function (header, body) {
  if (body) body = '<tbody>\n' + body + '</tbody>\n'
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + body
    + '</table>\n'
}

Renderer.prototype.tablecell = function (tag, content, align) {
  return '<'
    + tag
    + (align ? ' align="' + align + '"' : '')
    + '>'
    + content
    + '</'
    + tag
    + '>\n'
}

Renderer.prototype.tablerow = function (content) {
  return '<tr>\n' + content + '</tr>\n'
}

Renderer.prototype.div = function (content, kls) {
  return '<div class="' + (this.options.divClass || '') + ' ' + kls + '">\n' + content + '</div>\n'
}

Renderer.prototype.list = function (content, start) {
  var tag = start > 0 ? 'ol' : 'ul'
  var order = start > 1 ? (' start="' + start + '"') : ''
  return '<' + tag + order + '>\n' + content + '</' + tag + '>\n'
}

Renderer.prototype.li = function (content, task) {
  return '<li' + (task ? ' class="task-list-item"' : '') + '>' + content + '</li>\n'
}

// blockTags
_each([
  'dl',
  'dt',
  'dd',
  'p'
], function (name) {
  Renderer.prototype[name] = function (content) {
    return '<' + name + '>' + content + '</' + name + '>\n'
  }
})

Renderer.prototype.blockquote = function (content) {
  return '<blockquote>\n' + content + '</blockquote>\n'
}

// inlineTags
_each([
  'strong',
  'em',
  'code',
  'ins',
  'mark',
  'del',
  'sub',
  'sup'
], function (name) {
  Renderer.prototype[name] = function (text) {
    return '<' + name + '>' + text + '</' + name + '>'
  }
})

Renderer.prototype.link = function (href, text, title) {
  href = _escape(href, true)
  if (this.options.encodeURI || this.options.rfc3986) {
    href = encodeURI(href)
      // recover `%`
      .replace(/%25/g, '%')

    // https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURI
    if (this.options.rfc3986) {
      href = href.replace(/%5B/ig, '[').replace(/%5D/ig, ']')
    }
  }
  return '<a href="'
    + href
    + '"'
    + (title ? ' title="' + title + '"' : '')
    + '>'
    + text
    + '</a>'
}

Renderer.prototype.img = function (src, alt, title) {
  return '<img src="'
    + src
    + '" alt="'
    + alt
    + '"'
    + (title ? ' title="' + title + '"' : '')
    + (this.options.xhtml ? ' />' : '>')
}

Renderer.prototype.checkbox = function (checked) {
  return '<input '
    + (checked ? 'checked="" ' : '')
    + 'disabled="" type="checkbox"'
    + (this.options.xhtml ? ' /' : '')
    + '> '
}

// alias
Renderer.prototype.paragraph = Renderer.prototype.p
Renderer.prototype.image = Renderer.prototype.img

function Compiler(options, refs, fnrefs) {
  this.options = options || zmd.defaults
  this.rules = inlineRe

  this.refs = refs || Object.create(null)
  if (!fnrefs) fnrefs = Object.create(null)
  fnrefs.__n = []
  this.fnrefs = fnrefs

  this.renderer = this.options.renderer || new Renderer()
  this.renderer.options = this.options
}

Compiler.rules = inlineRe

Compiler.prototype.escape = function (text) {
  return text.replace(this.rules._escape, '$1')
}

Compiler.prototype.mangle = function (text) {
  var out = ''
  var ch
  for (var i = 0; i < text.length; i++) {
    ch = text.charCodeAt(i)
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16)
    }
    out += '&#' + ch + ';'
  }
  return out
}

Compiler.prototype.smartypants = function (text) {
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/([{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/([{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026')
}

Compiler.prototype.link = function (image, text, href, title) {

  href = this.escape(href)
  title = _escape(this.escape(title))

  return image ? this.renderer.image(
    href,
    _escape(text, true),
    title
  ) : this.renderer.link(
    href,
    this.compile(text),
    title
  )
}

Compiler.compile = function (text, options, refs, fnrefs) {
  var compiler = new Compiler(options, refs, fnrefs)
  return compiler.compile(text)
}

Compiler.prototype.compile = function (src) {
  var out = ''
  var link
  var text
  var href
  var title
  var cap

  var rules = this.rules
  var renderer = this.renderer

  while (src) {
    // escape
    if (cap = rules.escape.exec(src)) {
      src = src.substring(cap[0].length)
      out += _escape(cap[1])
      continue
    }

    // html tag
    if (cap = rules.html.exec(src)) {
      if (this.inLink && /^<\/a *>/i.test(cap[0])) {
        this.inLink = false
      } else if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true
      }

      if (this.inRawBlock && /^<\/(pre|code|kbd|script|math)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = false
      } else if (!this.inRawBlock && /^<(pre|code|kbd|script|math)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = true
      }

      src = src.substring(cap[0].length)
      out += renderer.html(cap[0])

      continue
    }

    // link
    if (cap = rules.link.exec(src)) {
      src = src.substring(cap[0].length)
      this.inLink = true

      text = _trim(cap[1])
      link = _trim(cap[2] || cap[3])
      title = cap[4] || cap[5] || cap[6] || ''

      out += this.link(cap[0][0] === '!', text, link, title)

      this.inLink = false
      continue
    }

    // footnote
    if (this.options.footnote && (cap = rules.footnote.exec(src))) {
      text = _trim(cap[1]).toLowerCase().replace(/\s+/g, ' ')

      link = this.fnrefs[text]

      if (link) {
        if (!link.index) {
          this.fnrefs.__n.push(this.compile(link.text))
          link.index = this.fnrefs.__n.length
        }
        out += '<sup><a href="#fn1" id="fnref1">[1]</a></sup>'.replace(/1/g, link.index)
        src = src.substring(cap[0].length)
        continue
      }
    }

    // reflink, nolink
    if ((cap = rules.reflink.exec(src)) || (cap = rules.nolink.exec(src))) {
      text = _trim(cap[1])
      link = _trim(cap[2] || cap[1]).toLowerCase().replace(/\s+/g, ' ')

      link = this.refs[link]

      if (link) {
        this.inLink = true
        out += this.link(cap[0][0] === '!', text, link.href, link.title)
        this.inLink = false

        src = src.substring(cap[0].length)
        continue
      }
    }

    // code
    if (cap = rules.code.exec(src)) {
      src = src.substring(cap[0].length)
      text = cap[2]
      // No stripping occurs if the code span contains only spaces
      if (!/^ *$/.test(text)) {
        // The stripping only happens if the space is on both sides of the string
        text = text.replace(/^((?: |\n)+)([\s\S]*?)\1$/, '$2')
          // replace line break to space
          .replace(/\n/g, ' ')
      }
      out += renderer.code(_escape(text))
      continue
    }

    // strong
    if (cap = rules.strong.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.strong(this.compile(cap[4] || cap[3] || cap[2] || cap[1]))
      continue
    }

    // em
    if (cap = rules.em.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.em(this.compile(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]))
      continue
    }

    // br
    if (cap = rules.br.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.br()
      continue
    }

    // del
    if (cap = rules.del.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.del(this.compile(cap[1]))
      continue
    }

    // mark
    if (cap = rules.mark.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.mark(this.compile(cap[1]))
      continue
    }

    // ins
    if (cap = rules.ins.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.ins(this.compile(cap[1]))
      continue
    }

    // sup
    if (cap = rules.sup.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.sup(this.compile(cap[1]))
      continue
    }

    // sub
    if (cap = rules.sub.exec(src)) {
      src = src.substring(cap[0].length)
      out += renderer.sub(this.compile(cap[1]))
      continue
    }

    // autolink
    if (cap = rules.autolink.exec(src)) {
      src = src.substring(cap[0].length)
      if (cap[2] === '@') {
        text = _escape(this.options.mangle ? this.mangle(cap[1]) : cap[1], true)
        href = 'mailto:' + text
      } else {
        text = _escape(cap[1], true)
        href = text
      }
      out += renderer.link(href, text)
      continue
    }

    // autourl
    if (!this.inLink && this.options.autourl && (cap = rules.autourl.exec(src))) {
      if (cap[2] === '@') {
        text = _escape(cap[1], true)
        href = 'mailto:' + text
      } else {
        text = cap[0]
        text = _escape(text, true)
        if (text[0] === 'w') {
          href = 'http://' + text
        } else {
          href = text
        }
      }
      out += renderer.link(href, text)
      src = src.substring(cap[0].length)
      continue
    }

    // text
    if (cap = rules.text.exec(src)) {
      src = src.substring(cap[0].length)
      if (this.inRawBlock) {
        out += renderer.text(cap[0])
      } else {
        text = _escape(cap[0], true)
        if (this.options.smartypants) {
          text = this.smartypants(text)
        }
        out += renderer.text(text)
      }
      continue
    }

    if (src) {
      _error('Unrecognized byte:' + src.charCodeAt(0))
    }
  }

  return out
}

function Parser(options) {
  this.tokens = []
  this.token = null
  this.options = options || zmd.defaults
  this.slugger = this.options.slugger || new Slugger()
  this.renderer = this.options.renderer || new Renderer()
  this.renderer.options = this.options
}

Parser.parse = function (tokens, options) {
  var parser = new Parser(options)
  return parser.parse(tokens)
}

Parser.prototype.parse = function (tokens) {
  this.compiler = new Compiler(this.options, tokens.refs, tokens.fnrefs)

  this.tokens = tokens.slice().reverse()

  var out = ''

  while (this.next()) {
    out += this.compile()
  }

  if (this.options.footnote && this.compiler.fnrefs.__n.length > 0) {
    out += this.renderer.footnote(this.compiler.fnrefs.__n)
  }

  return out
}

Parser.prototype.next = function () {
  this.token = this.tokens.pop()
  return this.token
}

Parser.prototype.peek = function () {
  return this.tokens[this.tokens.length - 1] || {}
}

Parser.prototype.compile = function () {
  var token = this.token
  var type = token.type
  var text = token.text
  var id
  var slug
  var header
  var body
  var cell
  var row
  var i
  var j
  var dl

  var renderer = this.renderer
  var compiler = this.compiler

  function renderDl(dt, dd) {
    var out = renderer.dt(compiler.compile(dt))
    for (i = 0; i < dd.length; i++) {
      out += renderer.dd(compiler.compile(_trim(dd[i])))
    }
    return out
  }

  switch (type) {
    case 'newline':
      return ''
    case 'hr':
      return renderer.hr()
    case 'raw':
      return renderer.raw(text)
    case 'heading':
      if (text) {
        if (this.options.headerIds) {
          id = this.slugger.get(text)
          slug = (this.options.headerPrefix || '') + id
        } else {
          slug = ''
        }
        return renderer.heading(
          compiler.compile(text),
          token.level,
          slug
        )
      }
      return renderer.heading('', token.level, '')
    case 'code':
      return renderer.codeblock(text)
    case 'fence':
      return renderer.fence(text, token.lang, token.meta)
    case 'table':
      body = ''
      cell = ''
      for (i = 0; i < token.header.length; i++) {
        cell += renderer.tablecell(
          'th',
          compiler.compile(token.header[i]),
          token.align[i]
        )
      }

      header = renderer.tablerow(cell)

      for (i = 0; i < token.cells.length; i++) {
        row = token.cells[i]
        cell = ''
        for (j = 0; j < row.length; j++) {
          cell += renderer.tablecell(
            'td',
            compiler.compile(row[j]),
            token.align[j]
          )
        }

        body += renderer.tablerow(cell)
      }

      return renderer.table(header, body)
    case 'deflist':
      dl = renderDl(token.dt, token.dd)

      while (this.peek().type && this.peek().type === type) {
        token = this.next()
        dl += renderDl(token.dt, token.dd)
      }

      return renderer.dl(dl)
    case 'blockquote_open':
      body = ''
      while (this.next().type !== 'blockquote_close') {
        body += this.compile()
      }
      return renderer.blockquote(body)
    case 'div_open':
      body = ''
      while (this.next().type !== 'div_close') {
        body += this.compile()
      }
      return renderer.div(body, _escape(token.kls))
    case 'list_open':
      body = ''
      while (this.next().type !== 'list_close') {
        body += this.compile()
      }
      return renderer.list(body, token.start)
    case 'item_open':
      body = ''
      if (token.task) {
        body += renderer.checkbox(token.checked)
      }
      while (this.next().type !== 'item_close') {
        body += !token.loose && this.token.type === 'text' ?
          this.parseText() :
          this.compile()
          // this.compile().replace(/^\n?([\s\S])/, '\n$1')
      }
      return renderer.li(body, token.task)
    case 'html':
      return renderer.html(text)
    case 'paragraph':
      return renderer.paragraph(compiler.compile(text))
    case 'text':
      return renderer.paragraph(this.parseText())

    default:
      _error('Unknown type:' + type)
  }
}

Parser.prototype.parseText = function () {
  var text = this.token.text
  while (this.peek().type === 'text') {
    text += '\n' + this.next().text
  }
  return this.compiler.compile(text)
}

function zmd(content, options) {
  if (!content) {
    return ''
  }
  options = _extend({}, zmd.defaults, options)
  try {
    return Parser.parse(Lexer.lex(content, options), options)
  } catch (error) {
    error.message += '\nPlease report this to https://github.com/xovel/zmd.'
    if (options.silent) {
      return '<p>An error occurred:</p><pre>'
        + _escape(error.message + '', true)
        + '</pre>'
    }
    throw error
  }
}

zmd.defaults = {
  langPrefix: 'language-',
  headerIds: true,
  headerPrefix: '',
  footnote: true,
  highlight: null,
  xhtml: false,
  autourl: false,
  divClass: 'diy'
}

zmd.Slugger = Slugger
zmd.Lexer = Lexer
zmd.Compiler = Compiler
zmd.Parser = Parser
zmd.Renderer = Renderer

zmd.parse = zmd

return zmd

})
