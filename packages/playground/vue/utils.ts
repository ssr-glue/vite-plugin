import path from 'path'
import fs from 'fs'

export const resolvePath = (filepath: string) => path.resolve(__dirname, filepath)
export const readFile = (filepath: string) => fs.readFileSync(resolvePath(filepath), 'utf-8')

const queryRE = /\?.*$/
const hashRE = /#.*$/
export const cleanUrl = (url: string) => url.replace(hashRE, '').replace(queryRE, '')
