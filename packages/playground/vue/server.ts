import compression from 'compression'
import serveStatic from 'serve-static'
import express, { Express } from 'express'
import { pathToRegexp } from 'path-to-regexp'
import serverSideApplication from './dist/server/main-server'
import { cleanUrl, readFile, resolvePath } from './utils'

const routes = [
  {
    path: '/landing-page/',
    template: readFile('dist/client/index.html'),
  },
  {
    path: '(.*)',
    template: readFile('dist/client/index.html'),
  },
]

function resolveTemplate(path: string): string | undefined {
  const matchedRoute = routes.find((route) => {
    return pathToRegexp(route.path).test(path)
  })

  if (!matchedRoute) {
    return
  }

  return matchedRoute.template
}

async function createServer(): Promise<Express> {
  await serverSideApplication.boot()

  const server = express()

  server.use(compression()).use(serveStatic(resolvePath('dist/client'), { index: false }))

  server.use('*', async (request, response) => {
    const url = cleanUrl(request.originalUrl)
    const template = resolveTemplate(url) as string
    const html = await serverSideApplication.render(template, request)

    response.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  return server
}

createServer().then((server) => {
  server.listen(3333, () => {
    console.log('http://localhost:3333')
  })
})
