import options from "toptions"
import { resolve } from "path"

const parse = options({
  path: options.arg(0),
  hostname: options.flag("h"),
  port: options.flag("p"),
  production: options.bit("P"),
  help: options.bit("h"),
})

const { path, production } = parse(process.argv.slice(2))
const root = resolve(path || "")

main()

async function main() {
  const { default: createServer } = await import("./server")
  createServer(root, production)
}
