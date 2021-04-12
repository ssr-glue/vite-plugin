import fs from 'fs'
import { IncomingMessage } from 'http'
import { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { ServerSideApplication } from '@ssr-glue/server-libs'

type FilePath = string
type PluginOptions = {
  /**
   * The map for {index-html-path : server-entry-path}
   */
  serverEntryScriptsMap?: {
    [IndexHTMLPath: string]: FilePath
  }
}

const defaultOptions: PluginOptions = {}

export function ViteSSRPlugin(userOptions: Partial<PluginOptions> = {}): Plugin {
  const pluginOptions = { ...defaultOptions, ...userOptions }

  let viteConfig: ResolvedConfig
  let viteDevServer: ViteDevServer
  let currentRequest: IncomingMessage

  function findServerEntryScriptByIndexHtmlPath(indexHtmlPath: FilePath): FilePath | null {
    const { serverEntryScriptsMap } = pluginOptions

    if (!serverEntryScriptsMap) {
      return null
    }

    return indexHtmlPath in serverEntryScriptsMap ? serverEntryScriptsMap[indexHtmlPath] : null
  }

  return {
    name: 'vite-ssr',

    configResolved(resolvedConfig) {
      // store the resolved config
      viteConfig = resolvedConfig

      // set the default value of `pluginOptions.entryScripts` if not given
      if (pluginOptions.serverEntryScriptsMap === undefined) {
        const indexHtmlPath = `${viteConfig.root}/index.html`
        const scriptPathJs = `${viteConfig.root}/src/main-server.js`
        const scriptPathTs = `${viteConfig.root}/src/main-server.ts`
        let scriptPath: string

        if (fs.existsSync(scriptPathJs)) {
          scriptPath = scriptPathJs
        } else if (fs.existsSync(scriptPathTs)) {
          scriptPath = scriptPathTs
        } else {
          throw new Error(
            `Couldn't find default server entry script at '${viteConfig.root}/src/main.(js|ts)'.`
          )
        }

        if (!fs.existsSync(indexHtmlPath)) {
          throw new Error(`Could not find index html at '${indexHtmlPath}'.`)
        }

        pluginOptions.serverEntryScriptsMap = { [indexHtmlPath]: scriptPath }
      }
    },

    async transformIndexHtml(html, ctx) {
      const entryScript = findServerEntryScriptByIndexHtmlPath(ctx.filename)

      if (!entryScript) {
        return
      }

      const isBuilding = !!ctx.bundle
      if (isBuilding) {
        return
      }

      if (process.env.SPA_MODE) {
        return
      }

      viteDevServer.moduleGraph.invalidateAll()

      const serverApp = (await viteDevServer.ssrLoadModule(entryScript)).default as ServerSideApplication

      await serverApp.boot()

      return await serverApp.render(html, currentRequest)
    },

    configureServer(server) {
      viteDevServer = server

      return () => {
        server.middlewares.use((req, res, next) => {
          currentRequest = req

          next()
        })
      }
    },
  }
}
