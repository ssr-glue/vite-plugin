import App from './App.vue'
import { vueAppPlugin } from 'ssr-glue-plugin-server-vue'
import { generateRoutesFromPages } from './main-universal'
import { ServerSideApplication } from '@ssr-glue/server-libs'
import { useHeadPlugin } from 'ssr-glue-plugin-server-vue-usehead'

const routes = generateRoutesFromPages()

const app = new ServerSideApplication({
  plugins: [
    vueAppPlugin({
      app: App,
      routes,
    }),
    useHeadPlugin(),
  ],
})

export default app
