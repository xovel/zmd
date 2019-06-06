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

    }
  }
  return obj
}

function _error(msg) {
  throw new Error(msg)
}

// Helpers End
// -----------

// ----------------
// Global variables

// header slugs
var slugs = {}
function getSlug(value) {
  var id = value.toLowerCase().trim().replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
  .replace(/\s/g, '-')
  if (slugs[id]) {
    id += '-' + slugs[id]++
  } else {
    slugs[id] = 1
  }
  return id
}

// include `image src`, `link href` and `footnote defination`
var refs = {}
function getRef(text, value) {
  var key = text.toLowerCase()
  if (!refs[key]) {
    refs[key] = value
  }
  return refs[key]
}

// Block rules
var commonRe = {
  // space: /\u0020/,
  // // whitespace: /\s+/,
  // // whitespace: /[ \t\n\v\f\r]+/,
  // whitespace: /[\u0020\u0009\u000a\u000b\u000c\u000d]+/, // is a space (U+0020), tab (U+0009), newline (U+000A), line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D).
  punctuation: /[!"#$%&'()*+,\-./\u0021-\u002f:;<=>?@\u003a-\u0040\[\\\]^_\u005b-\u0060{|}~\u007b-\u007e]/, // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., / (U+0021–2F), :, ;, <, =, >, ?, @ (U+003A–0040), [, \, ], ^, _, ` (U+005B–0060), {, |, }, or ~ (U+007B–007E).
  tagname: /[a-zA-Z][\w-]*/, // A tag name consists of an ASCII letter followed by zero or more ASCII letters, digits, or hyphens (-).
  attribute: /\s+[a-zA-Z:_][\w_.:-]*(?:\s*=\s*([^\s"'=<>`]+|'[^']*'|"[^"]*"))?/,
  opentag: /<tagname(?:attribute)*?\s*\/?>/,
  closingtag: /<\/tagname\s*>/,
  comment: /<!--(?!-?>)[\s\S]*?[^-]-->/,
  processing: /<\?[\s\S]*?\?>/,
  declaration: /<![A-Z]+\s+[^>]+>/,
  cdata: /<!\[CDATA\[[\s\S]+?\]\]>/,
  tag: /address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul/,
  label: /\[((?!\s*\])(?:\\[\[\]]|[^\[\]])+)\]/,
  destination: /<([^\n<>]*)>|((?!<)(?:\\[()]|\([^)\s]*\)|[^()\s])+)/,
  // title: /"((?:\\"|[^"])*)"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\(((?:[^()]|(?:\([^)]*\)))+)\)/,
  title: /"((?:(?:(?:\\"|[^"])*)|[^"\n]*(?:\n[^"\n]+)*\n?)+)"|'((?:(?:(?:\\'|[^'])*)|[^'\n]*(?:\n[^'\n]+)*\n?)+)'|\(((?:[^()]|(?:\([^)]*\)))+)\)/,
  delimiter: / *\|?((?: *:?-+:? *)+\|)\|? *\n/,
  row: / {0,3}\|?/,
}
var blockRules = {
  hr: /^ {0,3}([-*_])( *\1){2,} *(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6}) +([^\n]*?) *#* *(?:\n+|$)/,
  // setext heading
  sheading: /^( {0,3}\S[^\n]+(?:\n[^\n]+)*)\n {0,3}(=+|-+) *(?:\n+|$)/,
  // no multiline
  // sheading: /^( {0,3}\S[^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  code: /^( {4}[^\n]+\n*)+/,
  fence: /^ {0,3}([~`])\1{2,}([^`\n]*)\n([\s\S]*?)(?: {0,3}\1{3,} *(?:\n+|$)|$)/,
  html: /^ {0,3}(?:<(script|pre|style)[^>\n]*>[\s\S]*?(?:<\/\1>[^\n]*(?:\n+|$)|$)|(?:<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![\s\S]*?>|<!\[CDATA\[[\s\S]*?\]\]>)(?:[^\n]*\n+|$)|<\/?(tag)(?: +|\n|\/?)>[\s\S]*?(?:\n{2,}|$)|(?:<(?!script|pre|style)(?:tagname)(?:attribute)*?\s*\/?>|closingtag)[\s\S]*?(?:\n{2,}|$))+/i,
  ref: /^ {0,3}(?:label): *\n? *(?:destination) *\n? *(?:\s(?:title))? *(?:\n+|$)/,
  paragraph: /^([^\n]+(?:\n(?!hr|heading|sheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  newline: /^\n+/,
  text: /^[^\n]+/,
  table: /^(row)+(?:delimiter)(?:(row)*\n*|$)/,
}

// Block grammer
var block = {
  heading: /^ {0,3}(#{1,6}) +([^\n]*?) *#* *(?:\n+|$)/,
  lheading: /^( {0,3}\S[^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  // _hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/
  hr: /^ {0,3}([-*_])( *\1){2,} *(?:\n+|$)/,
  code: /^( {4}[^\n]+\n*)+/,
  list: /^( *)((?:[*+-]|\d+\.)) [\s\S]+?(?:\n+(?=\1?(?:[-*_] *){3,}(?:\n+|$))|\n+(?= *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))|\n{2,}(?! )(?!\1(?:[*+-]|\d+\.) )\n*|\s*$)/,
  item: /^( *)((?:[*+-]|\d+\.)) [^\n]*(?:\n(?!\1(?:[*+-]|\d+\.) )[^\n]*)*/gm,
  blockquote: /^( *>[^\n]+(\n(?! *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))[^\n]+)*\n*)+/,
  paragraph: /^((?:[^\n]+\n?(?! *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\2 *(?:\n+|$)|( *)((?:[*+-]|\d+\.)) [\s\S]+?(?:\n+(?=\3?(?:[-*_] *){3,}(?:\n+|$))|\n+(?= *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))|\n{2,}(?! )(?!\1(?:[*+-]|\d+\.) )\n*|\s*$)|( *[-*_]){3,} *(?:\n+|$)| *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)|([^\n]+)\n *(=|-){2,} *(?:\n+|$)|( *>[^\n]+(\n(?! *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))[^\n]+)*\n*)+|<(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\b)\w+(?!:\/|[^\w\s@]*@)\b| *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)))+)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/,
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  newline: /^\n+/,
  text: /^[^\n]+/,
  html: /^ *(?:<!--[\s\S]*?--> *(?:\n|\s*$)|<((?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\b)\w+(?!:\/|[^\w\s@]*@)\b)[\s\S]+?<\/\1> *(?:\n{2,}|\s*$)|<(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\b)\w+(?!:\/|[^\w\s@]*@)\b(?:"[^"]*"|'[^']*'|[^'">])*?> *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  // /^ {0,3}(`{3,}|~{3,})([^`\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/
  fence: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/
};

var inline = {
  link: /^!?\[((?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?)\]\(\s*(<(?:\\[<>]?|[^\s<>\\])*>|(?:\\[()]?|\([^\s\x00-\x1f\\]*\)|[^\s\x00-\x1f()\\])*?)(?:\s+("(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)))?\s*\)/,
  reflink: /^!?\[((?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
  text: /^(`+|[^`])[\s\S]*?(?=[\\<!\[`*]|\b_| {2,}\n|$)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  strong: /^__([^\s])__(?!_)|^\*\*([^\s])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s_][\s\S]*?[^\s])_(?!_)|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s\x00-\x1f<>]*|[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_]))>/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  del: /^~+(?=\S)([\s\S]*?\S)~+/,
  mark: /^\++(?=\S)([\s\S]*?\S)\++/,
  _: /[<>"']|&(?!#?\w+;)/,

  // https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type%3Demail)
  email: /[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/

};

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

function Lexer(content, options){
  this.tokens = [];
  this.block = block;
}

Lexer.prototype.parse = function(){

}

zmd.block = block;

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

return zmd

})
