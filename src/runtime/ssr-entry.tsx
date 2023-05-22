// 把组件代码渲染为字符串
import { App } from './app'
import { renderToString } from 'react-dom/server'

export function render() {
  return renderToString(<App />)
}
