import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)


import Home from './components/home.vue'
// import Hello from './components/hello.vue'

export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
        { path: '/', component: Home },
        { path: '/item/:id', component:()=>import('./components/item.vue')  }
    ]
  })
}