import { createApp } from './app'
const { app, router, store } = createApp()
router.onReady(() => {
  if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__) // context.state 将作为 window.__INITIAL_STATE__ 状态，自动嵌入到最终的 HTML 中
  }
  app.$mount('#app')
})