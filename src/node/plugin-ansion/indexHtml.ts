import { Plugin } from 'vite'
import { readFile } from 'fs/promises'
import { CLIENT_ENTRY_PATH, DEFAULT_TEMPLATE_PATH } from '../constants'

export function pluginIndexHtml(): Plugin {
  return {
    name: 'ansion:index-html',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: {
              type: 'module',
              src: `/@fs/${CLIENT_ENTRY_PATH}`
            },
            injectTo: 'body'
          }
        ]
      }
    },
    configureServer(server) {
      // 放在返回回调中兜底执行，若放在函数体里，可能会导致先于默认中间件执行，导致逻辑错误
      return () => {
        server.middlewares.use(async (req, res, next) => {
          // 1. 读取 template.html 的内容
          let content = await readFile(DEFAULT_TEMPLATE_PATH, 'utf-8')
          content = await server.transformIndexHtml(req.url, content, req.originalUrl)
          // 2. 响应 HTML 到浏览器
          res.setHeader('Content-Type', 'text/html')
          res.end(content)
        })
      }
    }
  }
}
