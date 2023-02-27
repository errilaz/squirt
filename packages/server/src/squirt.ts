import options from "toptions"
import { resolve } from "path"

const parse = options({
  path: options.arg(0),
  hostname: options.flag("h"),
  port: options.flag("p"),
  production: options.bit("P"),
  help: options.bit("h"),
})

const { path, production, hostname, port, help } = parse(process.argv.slice(2))
const root = resolve(path || "")

if (help) {
  usage()
  process.exit()
}

main()

async function main() {
  const { default: createServer } = await import("./server")
  createServer({
    root,
    production,
    hostname,
    port: port ? Number.parseInt(port) : undefined,
  })
}

function usage() {
  console.log(`Usage: squirt [options] [path]

  Options:
    -h, --hostname <value>    Bind to hostname
    -p, --port <value>        Port to listen on
    -P, --production          Run in production mode
    -h, --help                Display this message
`)
}