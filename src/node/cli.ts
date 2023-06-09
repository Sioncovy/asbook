import cac from 'cac'
import { createDevServer } from './dev'
import { build } from './build'
import { resolve } from 'path'

const cli = cac('ansion').version('0.0.1').help()

cli.command('dev [root]', 'start dev server').action(async (root: string) => {
  const server = await createDevServer(root)
  await server.listen()
  server.printUrls()
})

cli.command('build [root]', 'build in prod').action(async (root: string) => {
  // todo: resolve 用法
  root = resolve(root)
  await build(root)
})

cli.parse()
