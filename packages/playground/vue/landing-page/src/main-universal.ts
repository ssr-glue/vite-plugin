export function generateRoutesFromPages() {
  const pages = import.meta.glob(`./pages/*.vue`)

  return Object.keys(pages).map((path) => {
    const name = path.match(/\.\/pages(.*)\.vue$/)![1].toLowerCase()
    return {
      path: '/landing-page' + (name === '/home' ? '/' : name),
      component: pages[path], // () => import('./pages/*.vue')
    }
  })
}
