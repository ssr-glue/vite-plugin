<template>
  <h1>Home</h1>
  <p>
    <img src="../assets/logo.png" alt="logo" />
  </p>
  <button @click="state.count++">count is: {{ state.count }}</button>
</template>

<script>
import { useHead } from '@vueuse/head'
import { reactive, defineComponent } from 'vue'

export default defineComponent({
  setup() {
    useHead({
      // Can be static or computed
      title: 'Home Page',
      meta: [
        {
          name: 'description',
          content: 'an example description',
        },
      ],
      htmlAttrs: {
        lang: 'en',
      },
      bodyAttrs: {
        class: 'home',
      },
    })

    const state = reactive({ count: 0 })

    return { state }
  },
})
</script>

<style scoped>
h1,
a {
  color: green;
}
</style>
