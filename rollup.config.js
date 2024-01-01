import path from 'path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import json from '@rollup/plugin-json'
import ts from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const packageFormats = process.env.FORMATS && process.env.FORMATS.split(',')
const sourcemap = process.env.SOURCE_MAP

const packagesDir = path.resolve(__dirname, 'packages') // 解析出 packages 文件夹
const packageDir = path.resolve(packagesDir, process.env.TARGET) // 解析出当前的文件

const resolve = p => path.resolve(packageDir, p)

const name = path.basename(packageDir)

const pkg = require(resolve(`package.json`)) // 解析出 package.json 文件内容

const outputConfig = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es',
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife',
  },
}

const packageConfigs = packageFormats || pkg.buildOptions.formats

function createConfig(format, output) {
  output.sourcemap = sourcemap
  output.exports = 'named' // VueReactivity
  let external = []
  if (format === 'global') {
    output.name = pkg.buildOptions.name
  } else {
    external = [...Object.keys(pkg.dependencies)]
  }
  // 返回的结果就是 rollup 的配置
  return {
    input: resolve(`src/index.ts`),
    output,
    external,
    plugins: [json(), ts(), commonjs(), nodeResolve()],
  }
}

export default packageConfigs.map(format =>
  createConfig(format, outputConfig[format])
)
