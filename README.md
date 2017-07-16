# zmd

怎么的，假装自己是 `markdown` 编译工具不行吗？

## 综述

拟进行实现的块级功能包括：表格、块引用、段落、列表、代码块、水平线、定义列表。

行内模块拟实现的部分包含但不局限于：链接、图片、加粗、斜体、行内代码、删除线、标记、上标、下标、下划线。

计划加入的额外功能：自定义 div、脚注、公式。

## 参考项目

- [marked](https://github.com/chjj/marked)
- [remarkable](https://github.com/jonschlinkert/remarkable)
- [showdown](https://github.com/showdownjs/showdown)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [snarkdown](https://github.com/developit/snarkdown)

最后一条是新出的，原理简单粗暴，跟 zmd 的最初设计思路一致。

## `zmd` 的处理流程

接收到要处理的 markdown 文本，进行以下预处理工作：

1. 开头与结尾的留白去除。
2. 替换 TAB 键为四个空格。
3. 统一 Linux/Unix 换行符，去除多个换行。

可能还有一些预处理，届时也会全部进行处理。

然后开始对文本进行分块解析。根据各个块级模块的优先顺序，循环检查，有符合要求的，进行切割，存入一个中间数组，以备后续的渲染解析。

这一遍流程走完之后，得到的数组应该就是包含了分块解析后的子块级模块。

> 这里有一个特殊项目，就是链接和图片，以及后续可能会使用到的缩写定义、脚注的定义。这一块将会直接存进一个对象当中，当后续解析的时候，在从这里进行具体的数据提取。

然后依次对这些块级模块做行内解析。这一块面临的问题比较多，还需要做进一步的理顺。

## `marked` 原理分析

`marked` 是一个非常快速的 markdown 语法解析与编译工具。正如官方 repo 中的介绍一样：

> A markdown parser and compiler. Built for speed.

`marked` 的源码分析，这里不做详细说明，提一下其核心原理：

首先，`marked` 通过正则表达式对输入的字符串进行循环判断，对块状模块（如*表格*，*代码块*，*段落*，*列表*，*块引用*，*分隔符*等等）进行**块状分析**。

然后，依次对这些块状模块进行解析。涉及到复杂的块状模块，比如*表格*，*列表*，再进行一次块状分析。

块状分析完毕之后，依次对这些分析好的模块进行**行内分析**。

行内分析的方式跟块状分析类似，行内模块有：*链接*，*图片*，*行内代码*，*加粗*，*斜体*，*删除线*等等。

行内分析完毕之后，开始执行编译成 HTML 代码的工作。

### 块级模块优先级

1. **换行**。换行的正则判定为：`/^\n+/`
2. **代码块**。代码块的正则判定为：`/^( {4}[^\n]+\n*)+/`
3. **围栏代码**。`GFM` 风格的代码块，正则判定为：`` /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/ ``<!--`-->
4. **标题**。#标识符的标题类型，正则判定为`/^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/`
5. **无边缘竖线符的表格**。正则：`/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/`
6. **atx风格的标题**。`/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/`
7. **水平线**。`/^( *[-*_]){3,} *(?:\n+|$)/`
8. **块引用**。`/^( *>[^\n]+(\n(?! *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))[^\n]+)*\n*)+/`
9. **列表**。`/^( *)((?:[*+-]|\d+\.)) [\s\S]+?(?:\n+(?=\1?(?:[-*_] *){3,}(?:\n+|$))|\n+(?= *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))|\n{2,}(?! )(?!\1(?:[*+-]|\d+\.) )\n*|\s*$)/`
10. **HTML模块**。HTML 模块的正则判定比较复杂：`/^ *(?:<!--[\s\S]*?--> *(?:\n|\s*$)|<((?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\b)\w+(?!:\/|[^\w\s@]*@)\b)[\s\S]+?<\/\1> *(?:\n{2,}|\s*$)|<(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\b)\w+(?!:\/|[^\w\s@]*@)\b(?:"[^"]*"|'[^']*'|[^'">])*?> *(?:\n{2,}|\s*$))/`。中间一大串有竖线分割的字符串的每个单元表示 HTML 模块将会忽略的 HTML 标签。
11. **定义**。`/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/`。定义模块用来处理图片或者链接的预定义，这个模块的内容处理过后会从文本中删除。
12. **表格**。`/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/`。跟第 5 条类似。
13. **段落**。`` /^((?:[^\n]+\n?(?! *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\2 *(?:\n+|$)|( *)((?:[*+-]|\d+\.)) [\s\S]+?(?:\n+(?=\3?(?:[-*_] *){3,}(?:\n+|$))|\n+(?= *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))|\n{2,}(?! )(?!\1(?:[*+-]|\d+\.) )\n*|\s*$)|( *[-*_]){3,} *(?:\n+|$)| *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)|([^\n]+)\n *(=|-){2,} *(?:\n+|$)|( *>[^\n]+(\n(?! *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$))[^\n]+)*\n*)+|<(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\b)\w+(?!:\/|[^\w\s@]*@)\b| *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)))+)\n*/ ``<!--`-->
14. **文本**。`/^[^\n]+/`。事实上，经过以上处理过后的东西如果仍然走到这一步，就按文本进行处理。

### 行内优先级

1. **转义**。首先对转义字符进行处理。转义的正则表达式为：`` /^\\([\\`*{}\[\]()#+\-.!_>~|])/ ``。
2. **自动链接**。`/^<([^ >]+(@|:\/)[^ >]+)>/`。这里的自动链接是通过对应尖括号 `<>` 显式指定的。
3. **自动URL**。`/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/`。对符合规则的代码自动添加链接效果。
4. **行内HTML标签**。`/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/`。
5. **链接和图片**。`/^!?\[((?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*)\]\(\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*\)/`
6. **引用类型的链接和图片**。`/^!?\[((?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*)\]\s*\[([^\]]*)\]/`
7. **强调/加粗**。`/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/`
8. **斜体**。`/^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/`
9. **行内代码**。`` /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/ ``<!--`-->
10. **换行**。`/^ {2,}\n(?!\s*$)/`。广义的规则为：`/^ *\n(?!\s*$)/`
11. **删除线**。`/^~~(?=\S)([\s\S]*?\S)~~/`
12. **文本**。`` /^[\s\S]+?(?=[\\<!\[_*`~]|https?:\/\/| {2,}\n|$)/ ``

### 嵌套的处理

`markdown` 语法中同级模块是支持嵌套的，`marked` 在进行解析的时候也是支持嵌套的。具体实现了嵌套的模块如下：

- 列表
- 块引用
- 链接可以嵌套强调/斜体/删除线/行内代码，强调/删除线可以嵌套斜体/行内代码

marked 速度快的地方就体现这对这一块的处理上面。在块级模块的分析中，即列表和块引用，在每个块级模块分析处理的前后加入 `start` 和 `end` 标识，然后进行递归分析，方便在后面进行 HTML 解析的时候根据标识符来进行具体的操作。

### HTML 转码

行内代码和代码块的部分需要进行 HTML 编码变换，以支持特殊字符如 `<`、`>` 等。

### 尚未解决的一些问题

- 链接方式的 url 内不能包含圆括号 `)`。`*`
- 代码块语法 `` ``` `` 包起来的文本中不能包含 `` ``` ``。
- `gfm` 中的任务列表暂不支持。（编译渲染函数中可以稍作调整以支持该功能，因为一些特定因素，作者没有将其加入源代码中。）

## `remarkable` 原理分析

`remarkable` 是另一个速度极快的 markdown 解析工具。在常见的开源 markdown 解析工具中，`remarkable` 与 `marked` 的速度是最快的。

`remarkable` 采用的是模块化设计，构建之后的源代码中，包含了 59 个子模块（`1.5.0` 版本）。这也导致了另一个问题：代码体积较大。

`remarkable` 和 `marked` 的一些辅助函数本质上是一样的，比如 HTML 转码、正则表达式的替换、混淆链接等。两者对文本的处理步骤是类似的，都是先对文本进行预处理，分析块级模块，在需要进行嵌套的地方进行递归。块级模块的分析中也加入了 `start` 和 `end` 标识。事实上，大部分的模块包括行内模块都加入了 `start` 和 `end` 标识（图片/上标/下标/换行/普通文本没有，特殊模块比如代码也没有）。具体代码在 `renderer` 模块中。

### `remarkable` 支持的模块

相对 `marked`，`remarkable` 支持脚注、定义列表、任务列表等块级模块的解析。行内模块支持标记、上标、下标等，种类更多，功能更强大。

## 各个 markdown 解析工具速度的比较

总的来说，顺序是：`marked` > `remarkable` > `markdown-it` > `showdown`。

----

> 有个问题：标题在解析的时候生成的 ID 中不带中文了，中文全部变成了短杠 `-`。

来看看 `marked` 中关于标题的具体实现函数：

```js
Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};
```

造成中文丢失的核心代码是这一句：`raw.toLowerCase().replace(/[^\w]+/g, '-')`。

`/[^\w]+/g` 这个正则表达式匹配的是不是字母或者数字的字符，诸如符号和中文这些字符全部会替换成短杠 `-`。

仔细看了一下在用的 `hexo` 博客中，对 `Renderer` 做了特殊处理，改变了其行为，具体代码如下：

```js
// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
  var id = anchorId(stripHTML(text));
  var headingId = this._headingId;

  // Add a number after id if repeated
  if (headingId[id]) {
    id += '-' + headingId[id]++;
  } else {
    headingId[id] = 1;
  }
  // add headerlink
  return '<h' + level + ' id="' + id + '"><a href="#' + id + '" class="headerlink" title="' + stripHTML(text) + '"></a>' + text + '</h' + level + '>';
};
```

> 该文件位置在：`...\node_modules\hexo-renderer-marked\lib\renderer.js`

以上的代码中，在生成标题标签的 ID 的时候有一个重复判定的操作。`var id = anchorId(stripHTML(text));` 这一句代码是生成标题 ID 的代码，如果文章内有多个重名的标题，那么就需要在后面添加一个额外的标识来区别这些标题，以使得每个标题的 ID 是唯一的。

----

表格的处理：

markdown 语法的本身是不支持表格的，但是诸多 markdown 的解析工具中，都对表格添加了支持，其语法基本一般如下：

```markdown
a|b|c
--|--|--
A|B|C
D|E|F
```

----

定义列表相关处理

定义列表并非每个 markdown 解析器都支持，通常来说，其语法是：

```markdown
: abc
	def
```

另一种语法是
```markdown
AAA
:	aaa
```

zmd.js 的设定是支持定义列表这种语法，但具体语法要采用哪一种还需要进一步确定。
