const Vue = require('vue')
const express = require('express')
const server = express()

const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')


const renderer = require('vue-server-renderer').createBundleRenderer(serverBundle,{
    runInNewContext: false, // 推荐
    template: require('fs').readFileSync('./src/index.template.html', 'utf-8'),
    clientManifest // （可选）客户端构建 manifest
  })

// const createApp = require('./dist/main.server.js').default

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
  
  // createApp(context).then(app => {
    renderer.renderToString(context, (err, html) => {
      if (err) {
        res.status(500).end('Internal Server Error')
        return
      } else {
        res.end(html)
      }
    })
  // })

 
})

server.listen(8081,function() {
  console.log('port:8081')
})