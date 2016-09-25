# zmd

怎么的，假装自己是markdown编译工具不行吗？

## 暂时搁置

近期由于公司项目调整，无暇构建与实现zmd代码，暂时搁置之。具体开启时间未知。*2016.9.25 by xovel*

## 目的

参照[marked](https://github.com/chjj/marked)和[remarkable](https://github.com/jonschlinkert/remarkable)的原理实现的一个简单的markdown编译工具。

## `marked`原理分析

`marked`是一个非常快速的markdown语法解析与编译工具。正如官方repo中的介绍一样：

> A markdown parser and compiler. Built for speed.

`marked`的源码分析，这里不做详细说明，提一下其核心原理：

首先，`marked`通过正则表达式对输入的字符串进行循环判断，对块状模块（如_表格_，_代码块_，_段落_，_列表_，_块引用_，_分隔符_等等）进行**块状分析**。

然后，一次对这些块状模块进行解析。涉及到复杂的块状模块，比如_表格_，_列表_，再进行一次块状分析。

块状分析完毕之后，依次对这些分析好的模块进行**行内分析**。

行内分析的方式跟块状分析类似，行内模块有：_链接_，_图片_，_行内代码_，_加粗_，_斜体_，_删除线_等等。

行内分析完毕之后，开始执行编译成HTML代码的工作。

====

目前尚未解决的一些问题：

> 部分问题是`markdown`语法本身固有的设计缺陷，并非`marked`工具的问题，后面会跟一个`*`星号标注出来。

- 链接方式的url内不能包含圆括号`)`。`*`
- 代码块语法“\`\`\`”包起来的文本中不能包含\`\`\`。
- `gfm`中的任务列表暂不支持。（编译渲染函数中可以稍作调整以支持该功能，因为一些特定因素，作者没有将其加入源代码中。）



