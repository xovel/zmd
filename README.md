# zmd

怎么的，假装自己是 `markdown` 编译工具不行吗？

## Overview

尝试进行 `markdown` 编译，直接对标 [GitHub Flavored Markdown][gfm]。

[gfm]: https://github.github.com/gfm/
[commonmark]: https://spec.commonmark.org/0.29/

## Spec

- [CommonMark v0.29][commonmark], [镜像](https://xovel.github.io/zmd/spec/commonmark.html)
- [GitHub Flavored Markdown v0.29][gfm], [镜像](https://xovel.github.io/zmd/spec/gfm.html)

## Usage

```js
document.getElementById('content').innerHTML = zmd('## Hello `zmd`!')
```

## Demo

提供一个在线演练的页面：[zmd Playground](https://xovel.github.io/zmd)，可以在上面随意调试该工具。

- 左边部分为输入，右边部分为展示。
- 点击 `clear` 按钮可清空输入的文本。
- 点击 `clear` 右侧的选择框可以切换到选项设置。
- `Permalink` 为当前访问链接，可以进行分享操作。
- 点击右边部分的下拉选择框可以在预览界面、HTML 文本、和块状语法分析结果的查看。

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

- [ ] 测试
- [ ] CommonMark 语法覆盖率
- [ ] 命令行支持
- [ ] 插件系统

## License

[MIT](LICENSE)
