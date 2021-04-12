import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolvePath } from './utils'
import SSRGluePlugin from '@ssr-glue/vite-plugin-ssr'

export default defineConfig({
  plugins: [
    SSRGluePlugin({
      serverEntryScriptsMap: {
        [resolvePath('index.html')]: resolvePath('src/main-server.ts'),
        [resolvePath('landing-page/index.html')]: resolvePath('landing-page/src/main-server.ts'),
      },
    }),
    vue(),
  ],

  // todo: https://github.com/vitejs/vite/issues/2656
  // build: {
  //   rollupOptions: {
  //     input: {
  //       main: resolvePath('index.html'),
  //       landingPage: resolvePath('landing-page/index.html'),
  //     },
  //     output: {
  //       inlineDynamicImports: false,
  //     },
  //   },
  // },
})
