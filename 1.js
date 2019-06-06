'use strict'

const zmd = require('./zmd')

const axios = require('axios')

function api(options) {
  options = Object.assign({
    method: 'post',
    baseURL: 'https://api.github.com',
    headers: {

    }
  }, options)
  return new Promise((resolve, reject) => {
    axios(options).then(response => {
      console.log(response.headers)
      resolve(response.data)
    }).catch(error => {
      reject(error)
    })
  })
}

const {
  getRef,
  getSlug
} = zmd

console.log(getSlug('think i am the 【】  note'))
// console.log(getSlug('think'))
// console.log(getSlug('think'))
// console.log(getSlug('think'))
// console.log(getSlug('think'))
// console.log(getSlug('think'))

api({
  url: '/markdown',
  data: {
    "text":
`
    | foo | bar |
| ---:   | --- |
| baz | bim |
`,
    // "mode": "gfm",
    // "context": "github/gollum"
  }
}).then(res => console.log('then', res)).catch(error => console.log('catch', error))
