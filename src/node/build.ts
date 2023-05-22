import { InlineConfig, build as viteBuild } from 'vite'
import { CLIENT_ENTRY_PATH, SERVER_ENTRY_PATH } from './constants'
import * as path from 'path'
import type { RollupOutput } from 'rollup'
import * as fs from 'fs-extra'

export async function bundle(root: string) {
  try {
    const resolveViteConfig = (isServer: boolean): InlineConfig => {
      return {
        mode: 'production',
        root,
        build: {
          ssr: isServer,
          outDir: isServer ? '.temp' : 'build',
          rollupOptions: {
            input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
            output: {
              format: isServer ? 'cjs' : 'esm'
            }
          }
        }
      }
    }

    // 客户端渲染
    const clientBuild = async () => {
      return viteBuild(resolveViteConfig(false)) as Promise<RollupOutput>
    }
    // 服务端渲染
    const serverBuild = async () => {
      return viteBuild(resolveViteConfig(true)) as Promise<RollupOutput>
    }
    console.log('Building client + server bundles...')
    // client 和 server 的 build 是相互独立的，若使用 await 阻塞，会降低 build 性能
    // await clientBuild()
    // await serverBuild()
    // 使用 Promise.all 并行执行
    const [clientBundle, serverBundle] = await Promise.all([clientBuild(), serverBuild()])
    return [clientBundle, serverBundle]
  } catch (e) {
    console.error(e)
  }
}

export async function renderPage(render: () => string, root: string, clientBundle: RollupOutput) {
  const appHtml = render()
  const clientChunk = clientBundle.output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
  const html = `
  <!DOCTYPE html>
  <html lang="en">

    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>

    <body>
      <div id="root">${appHtml}</div>
      <script src="/${clientChunk?.fileName}" type="module"></script>
    </body>

  </html>
  `.trim()
  await fs.ensureDir(path.join(root, 'build'))
  // 保存为 HTML
  await fs.writeFile(path.join(root, 'build', 'index.html'), html)
  // ssr 渲染返回 html，渲染完成后删除 .temp 目录
  await fs.remove(path.join(root, '.temp'))
}

export async function build(root: string) {
  // 1. bundle - client + server 打包
  const [clientBundle, serverBundle] = await bundle(root)
  // 2. 引入 server-entry 模块
  const serverEntryPath = path.join(root, '.temp', 'ssr-entry.js')
  // 3. 服务端渲染，产出 HTML
  const { render } = require(serverEntryPath)
  await renderPage(render, root, clientBundle)
}
