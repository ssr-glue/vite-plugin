<template>
  <h1>{{ msg }}</h1>
  <h2>Landing Page</h2>
</template>

<script>
import { useHead } from '@vueuse/head'
import { defineComponent } from 'vue'

export default defineComponent({
  async setup() {
    useHead({
      // Can be static or computed
      title: 'About Page',
      meta: [
        {
          name: 'description',
          content: 'about page description',
        },
      ],
      htmlAttrs: {
        lang: 'ja',
      },
    })

    return {
      msg: 'About Page',
    }
  },
})
</script>

<style scoped>
h1 {
  color: red;
}
</style>
