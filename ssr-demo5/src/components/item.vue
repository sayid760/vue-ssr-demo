<template>
  <div>{{ item.text }}</div>
</template>

<script>
import titleMixin from '../title-mixin.js'
export default {
  mixins: [titleMixin],
  title () {
    return this.item.text
  },
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