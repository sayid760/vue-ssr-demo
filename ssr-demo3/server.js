const Vue = require('vue')
const express = require('express')
const server = express()
const renderer = require('vue-server-renderer').createRenderer({
    template: require('fs').readFileSync('./src/index.template.html', 'utf-8')
  })

const createApp = require('./dist/main.server.js').default

server.use('/dist',express.static('./dist')) // 设置访问静态文件路径

server.get('*', (req, res) => {

  const context = {
    title: 'vue ssr',
    meta: `
      <meta charset="utf-8">
      <meta ...>
    `,
    url:req.url
  }
  
  createApp(context).then(app => {
    renderer.renderToString(app,context, (err, html) => {
      if (err) {
        res.status(500).end('Internal Server Error')
        return
      } else {
        res.end(html)
      }
    })
  })

 
})

server.listen(8080,function() {
  console.log('port:8080')
})