function $(id) {
  return document.getElementById(id)
}

function on(elem, type, fn) {
  elem.addEventListener(type, fn, false)
}

var $markdown = $('markdown')
var $options = $('options')
var $inputType = $('inputType')
var $permalink = $('permalink')
var $clear = $('clear')
var $outputType = $('outputType')
var $responseTime = $('responseTime')
var $preview = $('preview')
var $previewIframe = $('previewIframe')
var $html = $('html')
var $lexer = $('lexer')

var $active = $preview

function urlParams() {
  var result = {}
  var values = location.hash.slice(1).split('&')
  for (var i = 0; i < values.length; i++) {
    var v = values[i].split('=')
    result[v[0].trim().toLowerCase()] = v.slice(1).join('=')
  }
  return result
}

function encode(text) {
  return encodeURIComponent(text)
}

function decode(text) {
  return decodeURIComponent(text)
}

// on($permalink, 'click', updateLink)

function updateLink(href) {
  href = href || '#text=' + encode($markdown.value) + '&options=' + encode($options.value) + '&input=' + $inputType.value + '&output=' + $outputType.value
  history.replaceState('', document.title, href)
  $permalink.setAttribute('href', href)
}

on($previewIframe, 'load', parseMarkdown)

var zmdOptions = zmd.defaults

window.addEventListener('hashchange', setParams)

function setParams() {
  var params = urlParams()

  if (params.text) {
    $markdown.value = decode(params.text)
  }

  var inputType = params.input === 'options' ? 'options' : 'markdown'
  var outputType = params.output === 'lexer' ? 'lexer' : params.output === 'html' ? 'html' : 'preview'

  $markdown.scrollTop = 0
  $options.scrollTop = 0
  $preview.scrollTop = 0
  $html.scrollTop = 0
  $lexer.scrollTop = 0

  $inputType.value = inputType
  $outputType.value = outputType

  handleOutputChange()
  handleInputChange()

  if (params.options) {
    try {
      zmdOptions = JSON.parse(decode(params.options))
    } catch (e) {

    }
  }
  setOptions(zmdOptions)
  parseMarkdown()
}

setParams()

function setOptions(options) {
  $options.value = JSON.stringify(options, null, ' ')
}

on($outputType, 'change', throttle(function () {
  handleOutputChange()
  updateLink()
}, 300))

function handleOutputChange() {
  var value = $outputType.value
  $preview.style.display = 'none'
  $html.style.display = 'none'
  $lexer.style.display = 'none'

  $active = $(value)

  $active.style.display = ''
}

on($inputType, 'change', throttle(function () {
  handleInputChange()
  updateLink()
}, 300))

function handleInputChange() {
  var value = $inputType.value
  $markdown.style.display = 'none'
  $options.style.display = 'none'

  $(value).style.display = ''
}

function parseMarkdown() {
  var startTime = Date.now()
  var value = $markdown.value

  var lexed
  var parsed
  var list = []

  var curOptions = Object.assign({}, zmdOptions, {
    highlight: function (code, lang) {
      var ret = ''
      try {
        ret = hljs.highlight(lang, code).value
      } catch (e) {
        //
      }
      return ret
    }
  })

  try {
    lexed = zmd.Lexer.lex(value, curOptions)
    parsed = zmd.Parser.parse(lexed, curOptions)
    setResponseTime(Date.now() - startTime)

    for (var i = 0; i < lexed.length; i++) {
      list.push(JSON.stringify(lexed[i]))
    }

    $preview.classList.remove('error')
    $html.classList.remove('error')
    $lexer.classList.remove('error')
  } catch (e) {
    var msg = e.stack || e.message
    parsed = msg
    list = [msg]
    $responseTime.textContent = '-'
    $active.style.display = 'none'
    $active = $html
    $active.style.display = ''
    $outputType.value = 'html'

    $preview.classList.add('error')
    $html.classList.add('error')
    $lexer.classList.add('error')
  }

  var scrollPercent = getScrollPercent()
  setParsed(parsed, list.join('\n'))
  setScrollPercent(scrollPercent)
}

var handleMarkdownInput = throttle(function () {
  parseMarkdown()
  updateLink()
}, 300)

function setResponseTime(ms) {
  var amount = ms
  var suffix = 'ms'
  if (ms > 1000 * 60 * 60) {
    amount = 'Too Long'
    suffix = ''
  } else if (ms > 1000 * 60) {
    amount = '>' + Math.floor(ms / (1000 * 60))
    suffix = 'm'
  } else if (ms > 1000) {
    amount = '>' + Math.floor(ms / 1000)
    suffix = 's'
  }
  $responseTime.textContent = amount + suffix
}

function getScrollPercent() {
  var size = getScrollSize()
  if (size <= 0) return 1
  return $active.scrollTop / size
}

function getScrollSize() {
  return $active.scrollHeight - $active.clientHeight
}

function setScrollPercent(percent) {
  $active.scrollTop = percent * getScrollSize()
}

on($markdown, 'change', handleMarkdownInput)
on($markdown, 'keyup', handleMarkdownInput)
on($markdown, 'keypress', handleMarkdownInput)
on($markdown, 'keydown', handleMarkdownInput)

function parseOptions() {
  var value = $options.value || '{}'

  try {
    zmdOptions = JSON.parse(value)
    $options.classList.remove('error')

    handleMarkdownInput()
  } catch (e) {
    $options.classList.add('error')
  }
}

var handleOptionsInput = throttle(parseOptions, 300)

on($options, 'change', handleOptionsInput)
on($options, 'keyup', handleOptionsInput)
on($options, 'keypress', handleOptionsInput)
on($options, 'keydown', handleOptionsInput)

on($clear, 'click', handleClearClick)

function handleClearClick() {
  $markdown.value = ''

  $inputType.value = 'markdown'
  $outputType.value = 'preview'

  handleOutputChange()
  handleInputChange()

  setScrollPercent(0)

  handleMarkdownInput()

  updateLink('#')
}

function setParsed(parsed, lexed) {
  try {
    $previewIframe.contentDocument.body.innerHTML = parsed
  } catch (ex) {}
  $html.value = parsed
  $lexer.value = lexed
}

/* eslint-disable */

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
function throttle(func, wait, options) {
  var timeout, context, args, result
  var previous = 0
  if (!options) options = {}

  var later = function () {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }

  var throttled = function () {
    var now = Date.now()
    if (!previous && options.leading === false) previous = now
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }

  throttled.cancel = function () {
    clearTimeout(timeout)
    previous = 0
    timeout = context = args = null
  }

  return throttled
}

/* eslint-enable */
