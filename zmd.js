/*!
 * zmd.js
 * Just a markdown parser for fun.
 */
+function(window, document, undefined){

// -------
// Helpers

// extend an object
var _extend = function( dest, source ){
  for( var name in source ){
    dest[name] = source[name];
  }
  return dest;
}

// traversal for an array or an object
var _each = function(obj, fn){
  
  var value, i = 0, length = obj.length;
  
  if( length === undefined ){
    for( i in obj ){
      if( false === fn.call( obj[ i ], i, obj[ i ] ) ) break;
    }
  } else {
    for ( ; i < length; i++ ) {
      if( false === fn.call( obj[ i ], i, obj[ i ] ) ) break;
    }
  }
  
  return obj;
}

var _error = function(msg){
  throw new Error(msg);
}

// Helpers End
// -----------

var block = {
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
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
  fence: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/
};
  
var zmd = function(content, options, callback){
  
  if(!content){
    _error('Need content');
  }

  if()

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
