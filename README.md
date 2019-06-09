# zmd

怎么的，假装自己是 `markdown` 编译工具不行吗？

## Overview

进行 `markdown` 编译，直接对标 [GitHub Flavored Markdown](https://github.github.com/gfm/)。

## Usage

```js
document.getElementById('content').innerHTML = zmd('## Hello `zmd`!')
```

## Demo

提供一个在线演练的页面：[zmd Playground](https://xovel.github.io/zmd)，可以在上面随意调试该工具。

- 左边部分为输入，右边部分为展示。
- 点击 `clear` 按钮可清空输入的文本。
- 点击 `clear` 右侧的选择框可以切换到选项设置。
- 点击 `permalink` 按钮可以将当前的输入生成一个链接，便于进行分享。
- 点击右边部分的下拉选择框可以在预览界面、HTML 文本、和块状语法分析结果的查看。

> 语法分析的结果未对列表参数进行详细处理，如定义列表和表格的解析结果。

## Markdown Syntax

支持大部分 GFM 语法。

另外加入了部分扩展语法：

- raw 文本
- 定义列表
- 自定义 div
- 脚注
- 上标
- 下标
- 插入
- 标记

GFM 语法中的自动链接增强语法默认不开启。另外 HTML 代码块支持度不够理想，不建议在编写 `markdown` 的时候过度依赖此特性。可以通过 raw 语法进行替代。

## 参考项目

- [marked](https://github.com/markedjs/marked)
- [remarkable](https://github.com/jonschlinkert/remarkable)
- [showdown](https://github.com/showdownjs/showdown)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [snarkdown](https://github.com/developit/snarkdown)

强烈感谢 `marked` 项目，`zmd` 核心参考项目。编译流程基本保持跟 `marked` 一致。

## TODO

- [ ] 文档
- [ ] 测试
- [ ] CommonMark 语法覆盖率
- [ ] 命令行支持

## License

[MIT](LICENSE)
