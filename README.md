<div align='center'>
  <h1>SSR-Glue for Vite</h1>
  <p>The Vite plugin for <a href='https://github.com/ssr-glue/ssr-glue'>SSR-Glue</a>.</p>
  <img width='360' src='https://user-images.githubusercontent.com/13927101/114373657-c9b2e200-9bbd-11eb-82bd-cb21880c22ff.png'>
</div>

<div align="center">
    <img src="https://img.shields.io/npm/v/@ssr-glue/vite-plugin" alt="version">
    <img src="https://img.shields.io/npm/l/@ssr-glue/vite-plugin" alt="license">
    <img src="https://img.shields.io/badge/</>-TypeScript-blue.svg" alt="TypeScript">
</div>

## Main Features
- [x] Extendable via plugins
- [x] Vite Dev server in SSR mode 
- [ ] Multi-Page App
- [ ] Serverless template building

## Installation
```shell
npm i @ssr-glue/vite-plugin
```

### Config the Plugin
```js
// vite.config.js
import { defineConfig } from 'vite'
import SSRGluePlugin from '@ssr-glue/vite-plugin'

export default defineConfig({
  plugins: [
    SSRGluePlugin()
  ]
})
```

### Server Entry Script
The client side entry script is the one you specified in your `index.html`.  
To enable SSR, you should have a server entry script counterpart.  
By default, the plugin will try to load `<project-root>/src/main-server.(js|ts)` for the server entry script.    
You can also specify it explicitly via the `serverEntryScriptsMap` option.

For example:
```js
import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import SSRGluePlugin from '@ssr-glue/vite-plugin'

export const resolvePath = (filepath: string) => path.resolve(__dirname, filepath)

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
})
```

Here the key of `serverEntryScriptsMap` is the path of your `index.html` file, while the value is the path of your server entry script for rendering that index.html.

## An Example for Vue.js
To make SSR work, you need 2 type of scripts:

* Server Entry Script
* Client Entry Script

The "**client entry script**" is the script you've given in the `index.html`.  
Obviously, if you only have such a script, it's just a normal SPA app, to enable SSR what you need is a "**server entry script**" for rendering the HTML at the server side.

This plugin expects your server entry scripts exports an instance of [`ServerSideApplication`](https://github.com/ssr-glue/ssr-glue/blob/9b22aeeb5f43eacd437295a4cf9256aa24f327ab/packages/server-libs/src/application.ts#L11) of [ssr-glue](https://github.com/ssr-glue/ssr-glue).
Which allow you to specify the [ssr-glue plugins](https://github.com/ssr-glue/plugins) you'd like to use for your SSR app.

It will be more clear to see an actual example setup.  
So for example, the structure of the `src` directory looks like this:
```
src
├── App.vue
├── main-client.ts
├── main-server.ts
├── main-universal.ts
└── pages
    ├── About.vue
    └── Home.vue
```

Here is our server entry script:
```ts
//main-server.ts
import App from './App.vue'
import { vueAppPlugin } from 'ssr-glue-plugin-server-vue'
import { generateRoutesFromPages } from './main-universal'
import { ServerSideApplication } from '@ssr-glue/server-libs'
import { useHeadPlugin } from 'ssr-glue-plugin-server-vue-usehead'

const routes = generateRoutesFromPages()

export default function ServerSideApplicationBuilder() {
  return new ServerSideApplication({
    plugins: [
      vueAppPlugin({
        app: App,
        routes,
      }),
      useHeadPlugin(),
    ],
  })
}
```

```ts
// main-universal.ts
// This is used by both server and client entry script

export function generateRoutesFromPages() {
  const pages = import.meta.glob(`./pages/*.vue`)

  return Object.keys(pages).map((path) => {
    const name = path.match(/\.\/pages(.*)\.vue$/)![1].toLowerCase()
    return {
      path: name === '/home' ? '/' : name,
      component: pages[path], // () => import('./pages/*.vue')
    }
  })
}
```

Here, two things you may have noticed:

1. The default exported object is a function that returns an instance of `ServerSideApplication`  
2. We're using 2 ssr-glue plugins: `ssr-glue-plugin-server-vue` and `ssr-glue-plugin-server-vue-usehead`

`ssr-glue-plugin-server-vue` is used for rendering the Vue.js app, in addition, `ssr-glue-plugin-server-vue-usehead` is
used for rendering the meta tags, html/body attributes(see [vueuse/head](https://github.com/vueuse/head) for more detail).

Also note that the order of the plugin matters, make sure you put `ssr-glue-plugin-server-vue-usehead` after `ssr-glue-plugin-server-vue`. 

As the example shows, you should pass the `App` component(your root component of your app) and the routes to the plugin,
then the plugin will create the app and router on behalf of you.  
If you want to access the created app instance, you could pass a callback like this:

```js
vueAppPlugin({
  app: App,
  routes,
  onAppCreated(app){
    // app.use(...)
    // app.component(...)
  }
})
```

Now, let's see how would our client entry script look like.

```ts
// main-client.ts
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
```

Looks like the exactly same as the server entry script...?  
No! If you look carefully, all `server***` has been replaced with `client***`.  
For instance:
* `ServerSideApplication` ---> `ClientSideApplication`
* `ssr-glue-plugin-server-vue` ---> `ssr-glue-plugin-client-vue`

One more difference is that the server entry script export a default function that returns an `ServerSideApplication` instance, whereas
the client entry script does not, instead it calls the `boot` method of the `ClientSideApplication`.

Why? Because `ClientSideApplication` is going to run immediately on the browser, whereas `ServerSideApplication`
should be `boot` on every single incoming HTTP request.

Actually, you can use any code in your client entry script, but as a result, it should be synced with the server
entry script. So ssr-glue plugin provides you the "client" counterpart plugins as well just for convenient. 

How about the `index.html` would look like? Here is an example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--head-tags-->
  </head>
  <body>
    <div id="app"><!--app-html--></div>
  </body>
</html>
```

where `<!--app-html-->` will be replaced with The rendered HTML for `App` component. This is possible because we are
using the `ssr-glue-plugin-server-vue` ssr-glue plugin.

***[ Note! ]***  
Make sure there are no spaces around the `<!--app-html-->`, otherwise you will get an error for the client side hydration.

Here is a BAD example:
```html
<div id="app">
  <!--app-html-->
</div>
```

after you've got the above setup done, when you run the `vite` command, it should work in the SSR mode now.

If you want to run it in SPA mode for some reason, you can set the environment variable `SPA_MODE` to `true`,

For example:
(Don't forget also install the `cross-env` package)
```json
{
  "scripts": {
    "dev": "vite",
    "dev:spa": "cross-env VITE_SPA_MODE=true vite"
  }
}
```

## Building for Production
In addition to the normal build, you are also going to build for the server entry script.  
Our scripts in `package.json` would be something look like this:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "build:client && build:server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/main-server.ts"
  }
}
```

The `build:server` is for our server entry bundling.  
Note that you must give the `--ssr` flag and specify the entry script explicitly.
For more details, see [Building for Production](https://vitejs.dev/guide/build.html) of Vite official guide.

As for how to use the built assets, it's out of topic, but you can see a full example include the node server implementation under the [playground](https://github.com/ssr-glue/vite-plugin/tree/main/packages/playground/vue) directory.

## Multi-Page App
Waiting for bugfix in Vite...

## Contribution
Contribution are always welcomed, feel free to send PRs 🖐🏼
