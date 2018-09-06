```markdown
// 第 1 步：创建一个 Vue 实例
const Vue = require('vue')
const app = new Vue({
  template: `<div>Hello World</div>`
})

// 第 2 步：创建一个 renderer
const renderer = require('vue-server-renderer').createRenderer()

// 第 3 步：将 Vue 实例渲染为 HTML
renderer.renderToString(app, (err, html) => {
  if (err) throw err
  console.log(html)
  // => <div data-server-rendered="true">Hello World</div>
})
```
引入vue-server-renderer，他里面又一个createRenderer的方法，这个方法里的renderToString，可以把app变成字符串，第一个参数是vue实例，第二个参数是回调（错误参数（err），编译好的字符串（html））。
把vue实例搬到服务器里面来

## 简单例子
```mardown
vue init webpack-simple ssr-demo
cd ssr-demo
//安装
npm install vue-server-renderer --save
```
```mardown
//新建server.js 复制官网例子
const Vue = require('vue')
const server = require('express')()
const renderer = require('vue-server-renderer').createRenderer()

server.get('*', (req, res) => {
  const app = new Vue({
    data: {
      url: req.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })

  renderer.renderToString(app, (err, html) => {
    if (err) {
      res.status(500).end('Internal Server Error')
      return
    }
    res.end(` //通过模板字符串嵌入html
      <!DOCTYPE html>
      <html lang="en">
        <head><meta charset="utf-8"><title>Hello</title></head>
        <body>${html}</body>
      </html>
    `)
  })
})

server.listen(8080)

```
```markdown
//启动服务器
node server.js
//查看
http://localhost:8080
```

## 使用一个页面模板
```markdown
const renderer = createRenderer({  //传入的是文件字符串，readFileSync同步读取
  template: require('fs').readFileSync('./index.template.html', 'utf-8')
})

renderer.renderToString(app, (err, html) => {
  console.log(html) // html 将是注入应用程序内容的完整页面
})
```
例子：
```markdown
//src/index.template.html
<!DOCTYPE html>
<html lang="en">
  <head><title>Hello</title></head>
  <body>
    <!--vue-ssr-outlet-->
  </body>
</html>
```
```markdown
//server.js
const Vue = require('vue')
const server = require('express')()
const renderer = require('vue-server-renderer').createRenderer({
    template: require('fs').readFileSync('./src/index.template.html', 'utf-8')
  })

server.get('*', (req, res) => {
  const app = new Vue({
    data: {
      url: req.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })

  renderer.renderToString(app, (err, html) => {
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
```
```markdown
//启动服务器
node server.js
```
## 插值
通过传入一个"渲染上下文对象"，作为 renderToString 函数的第二个参数，来提供插值数据
```markdown
const context = {
  title: 'hello',
  meta: `
    <meta ...>
    <meta ...>
  `
}
renderer.renderToString(app, context, (err, html) => {
  // 页面 title 将会是 "Hello"
  // meta 标签也会注入
})
```
例子：
```markdwon
//src/index.template.html
<html>
  <head>
    <!-- 使用双花括号(double-mustache)进行 HTML 转义插值(HTML-escaped interpolation) -->
    <title>{{ title }}</title>

    <!-- 使用三花括号(triple-mustache)进行 HTML 不转义插值(non-HTML-escaped interpolation) -->
    {{{ meta }}}
  </head>
  <body>
    <!--vue-ssr-outlet-->
  </body>
</html>
```
```markdwon
//server.js
const Vue = require('vue')
const server = require('express')()
const renderer = require('vue-server-renderer').createRenderer({
    template: require('fs').readFileSync('./src/index.template.html', 'utf-8')
  })

server.get('*', (req, res) => {
  const app = new Vue({
    data: {
      url: req.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })

  const context = {
    title: 'vue ssr',
    meta: `
      <meta charset="utf-8">
      <meta ...>
    `
  }
  
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
```

## 为每个请求创建一个新的根 Vue 实例
为什么要新建app.js
每次服务端渲染都要渲染一个新的app,不能用上一次渲染过的app对象，再去进行下一次渲染，因为app已经包含上一次渲染过的状态会影响我们渲染内容，所以每次都要去给他创建新的app
```markdown
// src/app.js
const Vue = require('vue')
module.exports = function createApp (context) {
  return new Vue({
    data: {
      url: context.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })
}
```
```markdown
//server.js
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
```
```js
//启动服务器
node server.js
//查看
http://localhost:8080/5555
```
[源码：demo](https://github.com/sayid760/vue-ssr-demo/tree/master/ssr-demo1)
## router
![image](https://github.com/sayid760/vue-ssr-demo/blob/master/screenshots/router.jpg)
通过createRenderer渲染出来的只是应用内的内容，只是bundle的部分html代码，没有script标签去引用js文件,js文件是要我们自己去获取，并且要插入到html里面去，组成一个完整的html，返回给客户端，这样用户加载过去才能真正运行应用，不然的话只能看到我们访问这个页面的html内容，但是无法进行操作，不能进行路由跳转，所以这里自己手动引入打包的js<br/>
ssr是一份代码运行在两个环境里面（服务端、客户端），服务端先运行好之后，把模板渲染成html页面，然后返回给前端，前端再载入js文件<br/>
例子：<br/>
|-build <br/>
| |-webpack.base.config.js   //基础的，通过merge合并到client和server上面<br/>
| |-webpack.client.config.js  //客户端打包配置<br/>
| |-webpack.server.config.js  //服务端打包配置<br/>
|-src<br/>
| |-components<br/>
| | |-home.vue<br/>
| | |-item.vue<br/>
| |-App.vue<br/>
| |-app.js<br/>
| |-router.js<br/>
|-server.js<br/>

如果增加路由这个逻辑，就要为路由添加渲染，<br/>
router.matchedComponents 所有路由匹配到的路径<br/>

```js
// app.js
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
export function createApp () {
  // 创建 router 实例
  const router = createRouter()
  const app = new Vue({
    // 注入 router 到根 Vue 实例
    router,
    render: h => h(App)
  })
  //注入和导出router
  // 返回 app 和 router
  return { app, router }
}
```
```js
// router.js
import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)
import Home from './components/home.vue'
export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
        { path: '/', component: Home },
        { path: '/item/:id', component:()=>import('./components/item.vue')  }
    ]
  })
}
```
```js
// entry-server.js
import { createApp } from './app'
export default context => {
    // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
    // 以便服务器能够等待所有的内容在渲染前，
    // 就已经准备就绪。
  return new Promise((resolve, reject) => {
    // 解构赋值
    const { app, router } = createApp()
    // 设置服务器端 router 的位置
    router.push(context.url)
    // 等到 router 将可能的异步组件和钩子函数解析完
    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      // 匹配不到的路由，执行 reject 函数，并返回 404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }
      // Promise 应该 resolve 应用程序实例，以便它可以渲染
      resolve(app)
    }, reject)
  }).catch(new Function());
}

//返回的app是交给Bundle Renderer处理的，把html字符串渲染成html
```
```js
// index.template.html
<html>
  <head>
    <!-- 使用双花括号(double-mustache)进行 HTML 转义插值(HTML-escaped interpolation) -->
    <title>{{ title }}</title>
    <!-- 使用三花括号(triple-mustache)进行 HTML 不转义插值(non-HTML-escaped interpolation) -->
    {{{ meta }}}
  </head>
  <body>
    <!--vue-ssr-outlet-->
    <script src="/dist/manifest.client.js"></script>
    <script src="/dist/main.client.js"></script>
  </body>
</html>
```
```js
//打包
npm run build

// 启动
npm run dev
```
[源码：demo](https://github.com/sayid760/vue-ssr-demo/tree/master/ssr-demo2)

## 服务器端数据预取
例子：<br/>
|-build<br/>
| |-webpack.base.config.js   //基础的，通过merge合并到client和server上面<br/>
| |-webpack.client.config.js  //客户端打包配置<br/>
| |-webpack.server.config.js  //服务端打包配置<br/>
|-src<br/>
| |-components<br/>
| |-App.vue<br/>
| |-app.js<br/>
| |-router.js<br/>
| |-store.js<br/>
|-server.js<br/>

vuex-router-sync<br/>
主要是把vue-router的状态放进vuex的state中（把vue-router 纳入 vuex 的 state 中使用），这样就可以通过改变state来进行路由的一些操作，当然直接使用像是 $route.go之类的也会影响到state，会同步的是这几个属性<br/>
参考：https://github.com/vuejs/vuex-router-sync
```js
//安装
npm i vuex-router-sync
```
```js
// store.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// 假定我们有一个可以返回 Promise 的
// 通用 API（请忽略此 API 具体实现细节）
import { fetchItem } from './api'

export function createStore () {
  return new Vuex.Store({
    state: {
      items: {}
    },
    actions: {
      fetchItem ({ commit }, id) {
        // `store.dispatch()` 会返回 Promise，
        // 以便我们能够知道数据在何时更新
        return fetchItem(id).then(item => {
          commit('setItem', { id, item })
        })
      }
    },
    mutations: {
      setItem (state, { id, item }) {
        Vue.set(state.items, id, item)
      }
    }
  })
}
```

```js
// app.js
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'
import { sync } from 'vuex-router-sync'

export function createApp () {
  // 创建 router 和 store 实例
  const router = createRouter()
  const store = createStore()

  // 同步路由状态(route state)到 store
  sync(store, router)

  // 创建应用程序实例，将 router 和 store 注入
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  // 暴露 app, router 和 store。
  return { app, router, store }
}
```
```js
// item.vue
<template>
  <div>{{ item.title }}</div>
</template>

<script>
export default {
  asyncData ({ store, route }) {
    // 触发 action 后，会返回 Promise
    return store.dispatch('fetchItem', route.params.id)
  },
  computed: {
    // 从 store 的 state 对象中的获取 item。
    item () {
      return this.$store.state.items[this.$route.params.id]
    }
  }
}
</script>
```
[源码：demo](https://github.com/sayid760/vue-ssr-demo/tree/master/ssr-demo3)

## 混合
![image](https://github.com/sayid760/vue-ssr-demo/blob/master/screenshots/render.jpg)
bundle renderer可以说是createRenderer，通过它可以把html字符串渲染成html，再通过client Bundle（js功能之类的）和html进行混合

```js
//安装
npm i webpack-node-externals webpack-merge
```

```js
//server.js
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
```
```js
// webpack.client.config.js
plugins: [
	new VueSSRClientPlugin()
]
// webpack.server.config.js
plugins: [
	new VueSSRClientPlugin()
]
```
[源码：demo](https://github.com/sayid760/vue-ssr-demo/tree/master/ssr-demo4)

## 修改title
src<br/>
|-title-mixin.js<br/>
```js
// title-mixin.js
function getTitle (vm) {
    // 组件可以提供一个 `title` 选项
    // 此选项可以是一个字符串或函数
    const { title } = vm.$options //判断参数上有没有title，且类型是不是函数
    if (title) {
      return typeof title === 'function'
        ? title.call(vm)
        : title
    }
  }
  
  const serverTitleMixin = { //server没办法调用mouted,只能在created调用
    created () {
      const title = getTitle(this)
      if (title) {
        this.$ssrContext.title = title
      }
    }
  }
  
  const clientTitleMixin = {
    mounted () {
      const title = getTitle(this)
      if (title) {
        document.title = title
      }
    }
  }
  
  // 可以通过 `webpack.DefinePlugin` 注入 `VUE_ENV`
  export default process.env.VUE_ENV === 'server'
    ? serverTitleMixin
    : clientTitleMixin
```
```js
// webpack.server.config.js
plugins: [
    new webpack.DefinePlugin({ // 定义全局变量
      'process.env':{
        VUE_ENV:'"server"'
      }
    })
  ]
  
// webpack.client.config.js
plugins: [
    new webpack.DefinePlugin({ // 定义全局变量
      'process.env':{
        VUE_ENV:'"client"'
      }
    })
  ]
```
```js
// item.vue
import titleMixin from '../title-mixin.js'
export default {
  mixins: [titleMixin],
  title () {
    return this.item.text
  }
}
```
[源码：demo](https://github.com/sayid760/vue-ssr-demo/tree/master/ssr-demo5)
