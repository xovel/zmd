# zmd

怎么的，假装自己是 `markdown` 编译工具不行吗？

## Overview

尝试进行 `markdown` 编译，直接对标 [GitHub Flavored Markdown][gfm]。

[gfm]: https://github.github.com/gfm/
[commonmark]: https://spec.commonmark.org/0.29/

## Spec

- [CommonMark v0.29][commonmark], [镜像](https://xovel.github.io/zmd/spec/commonmark.html)
- [GitHub Flavored Markdown][gfm], [镜像](https://xovel.github.io/zmd/spec/gfm.html)

## Demo

提供一个在线演练的页面：[zmd Playground](https://xovel.github.io/zmd)，可以在上面随意调试该工具。

- 左边部分为输入，右边部分为展示。
- 点击 `clear` 按钮可清空输入的文本。
- 点击 `clear` 右侧的选择框可以切换到选项设置。
- `Permalink` 为当前访问链接，可以进行分享操作。
- 点击右边部分的下拉选择框可以在预览界面、HTML 文本、和块状语法分析结果的查看。

## Install

```
npm i zmdjs --save
```

## Usage

```js
const zmd = require('zmdjs')
const out = zmd('## Hello `zmd`!')
```

```html
...
<script src="/path/to/zmd.js"></script>
...
<script>
  document.getElementById('content').innerHTML = zmd('## Hello `zmd`!')
</script>
...
```

> 通常来说，输出的文本会有拖尾换行，在使用时可根据实际情况进行移除。

## Options

```js
zmd(text, options)
```

| 选项 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| langPrefix| String | language- | 代码块给定语言时的 CSS 类名前缀 |
| headerIds | Boolean | true | 是否给标题一个唯一标识 |
| headerPrefix | String | '' | 标题唯一标识的前缀 |
| footnote | Boolean | true | 是否开启脚注功能 |
| highlight | Function | null | fence 代码块高亮方法 |
| xhtml | Boolean | false | 使用 XHTML 语法 |
| autourl | Boolean | false | 是否开启链接自动识别 |
| divClass | String | diy | 自定义 div 的类名 |
| ignoreBlankLine | Boolean | false | 忽略空行 |
| encodeURI | Boolean | false | 是否对链接的 href 开启 encodeURI 转义 |
| rfc3986 | Boolean | false | 是否对链接的 href 开启 encodeURI 转义并遵循 RFC3986 |

> `options.renderer` 的说明见下面的 [`Renderer`](#renderer) 说明。

## Renderer

`renderer` 可以进行渲染器的自定义，以为代码示例演示了一个自定义标题渲染方法：

```js
const renderer = new zmd.Renderer()
// const _heading = renderer.heading
renderer.heading = function (text, level, slug) {
  return '<h'
    + level
    + (slug ? ' id="' + slug + '"' : '')
    + '>'
    + (slug ? '<a href="#' + slug + '" class="header-link"></a>' : '')
    + text
    + '</h'
    + level
    + '>\n'
}

zmd('## demo', {renderer})
zmd('###', {renderer})
```

```html
<h2 id="demo"><a href="#demo" class="header-link"></a>demo</h2>

<h3></h3>


```

当前的默认渲染器提供以下方法：

| 方法名 | 说明 | 参数 | 备注 |
| ------ | ---- | ---- | ---- |
| hr | 水平线 | 无 |
| br | 水平线 | 无 |
| heading | `text, level, slug` | 标题文本、级别、唯一标识 |
| codeblock | 块级代码块 | `code` | 代码文本 |
| fence | fence 代码块 | `code, lang, meta, escaped` | 代码文本，语言、附加信息、是否已经转义 |
| footnote | 脚注 | `footnotes` | 脚注的数组（详细说明见下方 [`脚注`](#脚注) 说明） |
| raw | 原始文本 | `text` | 文本 |
| text | 普通文本 | `text` | 文本 |
| html | HTML 文本 | `text` | 文本 |
| table | 表格 | `header, body` | 表格标题和表格主体 |
| tablecell | 表格单元格 | `tag, content, align` | 单元格标签，单元格内容、对齐方式 |
| tablerow | 表格行 | `content` | tr 的内容 |
| div | 自定义 div | `content, kls` | 内容和类名 |
| list | 列表 | `content, start` | 列表内容，列表开始标记（大于 0 表示为有序列表，值为起始值） |
| li | 列表项 | `content, task` | 列表项内容，是否为任务列表 |
| dl | 定义列表 | `content` | 内容 |
| dt | 定义列表标题 | `content` | 内容 |
| dd | 定义列表项 | `content` | 内容 |
| p | 段落 | `content` | 内容 |
| blockquote | 块引用 | `content` | 内容 |
| strong | 着重强调 | `text` | 文本 |
| em | 普通强调 | `text` | 文本 |
| code | 定义列表 | `text` | 文本 |
| ins | 插入 | `text` | 文本 |
| mark | 标记 | `text` | 文本 |
| del | 删除线 | `text` | 文本 |
| sub | 下标 | `text` | 文本 |
| sup | 上标 | `text` | 文本 |
| link | 链接 | `href, text, title` | 链接目标，展示文本，标题 |
| img | 图片 | `src, alt, title` | 图片源，辅助文本，标题 |
| checkbox | 复选框 | `checked` | 是否选中 |
| paragraph | 段落 | `p` 的别名 |
| image | 图片 | `img` 的别名 |

## Markdown Extend Syntax

### raw 文本

原始文本，将不做任何处理，原样进来，原样出去。

语法标识为以 `{% raw %}` 开头，以 `{% endraw %}` 结束。

`raw`/`endraw` 与边界之间支持任意数量的空格。`%` 符号可以省略。

### 定义列表

支持**紧凑**的定义列表。

定义列表包含一个定义标题和数个定义内容，所有部分均为**单行**。

> 多行的支持暂时不做支持，后续可自行通过插件系统实现。

语法识别规则为针对定义内容进行识别，定义内容以冒号 `:` 开头。

多个定义内容之间的空行将被忽略。

定义内容与开头冒号之间的空格将被忽略。

有多个定义标题的，写在一起即可。

```
我是标题
: 我是内容1
: 我是内容2
```

### 自定义 div

使用 `:::` 包裹的内容视为自定义 div。

可以在 `:::` 后面跟文本表示该 div 的类名。

结束的冒号 `:` 可以有多个。

### 脚注

支持**单行**脚注。

脚注的语法分为两个部分，一个为定义，一个为使用。

定义的语法为块级语法，跟链接的定义类似，但是开头为 `^`。

使用的语法为行内语法， 表述为 `[^name]`，其中 `name` 为定义过的名称，如果未进行定义，则忽略之。

序号会自动进行调整。

### 上标

以 `^^` 进行包裹的行内语法。渲染器采用 `sup` 标签进行输出。

### 下标

以 `~` 进行包裹的行内语法。渲染器采用 `sub` 标签进行输出。

> 注意，如果使用 `~~`，为删除线语法。嵌套的处理未做特殊处理，请避免**嵌套**这两个语法。

### 插入

以 `++` 进行包裹的行内语法。渲染器采用 `ins` 标签进行输出。

### 标记

以 `==` 进行包裹的行内语法。渲染器采用 `mark` 标签进行输出。

GFM 语法中的自动链接增强语法默认不开启。另外 HTML 代码块支持度不够理想，不建议在编写 `markdown` 的时候过度依赖此特性。可以通过 raw 语法进行替代。

## Special Thanks

特别感谢 `marked` 项目，当前版本的 `zmd` 的核心参考。编译流程基本保持跟 `marked` 一致。

## 参考项目

- [marked](https://github.com/markedjs/marked)
- [commonmark.js](https://github.com/commonmark/commonmark.js)
- [remarkable](https://github.com/jonschlinkert/remarkable)
- [showdown](https://github.com/showdownjs/showdown)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [snarkdown](https://github.com/developit/snarkdown)

## TODO

- [x] 测试
  > 当前只针对 Slugger 对象进行了测试，具体测试文件为 `test/slug.js`。
- [x] 语法覆盖率
  > 针对 GFM 语法规范进行检验性测试，直接严格比对，未处理单引号转换和 TAB 的差异。测试文件为 `test/gfm.js` 和 `test/diff.js`，有先后顺序，测试结果为 `test/diff.json`。
- [ ] 命令行支持
- [ ] 插件系统

## License

[MIT](LICENSE)
