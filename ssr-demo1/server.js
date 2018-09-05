const Vue = require('vue')
const server = require('express')()
const renderer = require('vue-server-renderer').createRenderer({
    template: require('fs').readFileSync('./src/index.template.html', 'utf-8')
  })

server.get('*', (req, res) => {
  const createApp = require('./src/app')

  const context = {
    title: 'vue ssr',
    meta: `
      <meta charset="utf-8">
      <meta ...>
    `,
    url:req.url
  }
  const app = createApp(context)
  renderer.renderToString(app, context,(err, html) => {
    if (err) {
      res.status(500).end('Internal Server Error')
      return
    }
    res.end(html)
  })
})

server.listen(8080,function() {
  console.log('port:8080')
})