# 更新记录

## [v0.3.0](https://github.com/xovel/zmd/compare/v0.2.1...v0.3.0)

- 添加规范覆盖率的测试脚本。
- 代码块 `code` 重命名为 `codeblock`。
- 对 `highlight` 方法进行异常捕获。
- ATX 标题支持空行。
- 列表解析改进。
- 列表渲染方法参数调整。
- 完善对任务列表的支持。
- 自定义 div 的 CSS 类名默认值修订为空字符串。
- 修订自定义 div 的类名渲染。

## [v0.2.1](https://github.com/xovel/zmd/compare/v0.2.0...v0.2.1)

- 测试方法优化。
- 标签、属性、HTML 字符串匹配正则改进。
- 空行 `newline` 重命名为 `blankline`。

## [v0.2.0](https://github.com/xovel/zmd/compare/v0.1.0...v0.2.0)

- `fence` 代码块的高亮语言的默认前缀修订为 `language-`。
- `heading` 标题的 id 渲染移动至渲染器中。
- `hr` 和 `br` 的渲染器方法修订。
- 添加 `ignoreBlankLine` 选项用于过滤空行。
- 修订正则表达式辅助方法。
- `slugger` 算法优化。
- 修订部分解析方法。
- 添加测试用例。

## v0.1.0

首个版本，实现 `markdown` 语法的解析。
