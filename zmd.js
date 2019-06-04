/*!
 * zmd.js
 * Just a markdown parser
 * @author: xovel
 * @license: MIT
 */
+function (window, document, undefined) {

// -------
// Helpers

// extend an object
function _extend(dest, source) {
  for (var name in source) {
    dest[name] = source[name];
  }
  return dest;
}

// traversal for an array or an object
function _each(obj, fn) {

  var value, i = 0, length = obj.length;

  if (length === undefined) {
    for (i in obj) {
      if (false === fn.call(obj[ i ], i, obj[ i ])) break;
    }
  } else {
    for (; i < length; i++) {
      if (false === fn.call(obj[ i ], i, obj[ i ])) break;
    }
  }

  return obj;
}

function _error(msg) {
  throw new Error(msg);
}

// Helpers End
// -----------

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

window.zmd = zmd;

}(window, document);
