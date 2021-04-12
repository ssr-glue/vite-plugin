import App from './App.vue'
import { vueAppPlugin } from 'ssr-glue-plugin-client-vue'
import { generateRoutesFromPages } from './main-universal'
import { ClientSideApplication } from '@ssr-glue/client-libs'
import { useHeadPlugin } from 'ssr-glue-plugin-client-vue-usehead'

const routes = generateRoutesFromPages()

const app = new ClientSideApplication({
  plugins: [
    vueAppPlugin({
      app: App,
      routes,
    }),
    useHeadPlugin(),
  ],
})

app.boot()
