import * as Path from "path"
import watch from "inwatch"
import { Server } from "bun"
import "@squirt/markup/src/globals.ts"
import "./plugins"
import createRouter from "./router"
import createLoader from "./loader"
import defineGlobals from "./globals"
import serveStatic from "serve-static-bun"

const sourcePattern = /\.(tsx?|jsx?|civet|json|toml)$/
const globalPattern = /\.global\.(ts|js|civet)$/

export interface ServerOptions {
  root: string
  production: boolean
  hostname?: string
  port?: number
}

export default async function createServer({ root, production, hostname, port }: ServerOptions) {
  const loader = createLoader()
  const router = await createRouter(root, loader, production)
  const globalExtensions: Map<string, Set<string>> = new Map()
  const fetchPublic = serveStatic("public")

  defineGlobals(root, production)
  createWatcher()

  const server: Server = Bun.serve({
    hostname,
    port: port || 3000,
    fetch,
    websocket: {
      open,
      message: router.message,
      close: router.close,
      drain: router.drain,
    }
  })

  console.log(`🌭 Squirt listening on :${server.port} at "${root}"`)
  return server

  async function fetch(request: Request) {
    console.log(request.method, request.url)
    const url = new URL(request.url)
    if (!production && url.pathname === "/_live_reload_") {
      return await connectLiveReload(request)
    }
    const response = await router.request(request, server)
    if (response !== null) {
      return response
    }
    return fetchPublic(request)
  }

  async function open(ws: SquirtWebSocket) {
    if (!production && ws.data.type === "live-reload") {
      ws.subscribe("_live_reload_")
    }
    else {
      return router.open(ws)
    }
  }

  async function connectLiveReload(request: Request) {
    if (server.upgrade(request, { data: { type: "live-reload" }})) {
      return new Response("Could not connect live reload web socket.", { status: 400 })
    }

    return undefined
  }

  function createWatcher() {
    const watcher = watch(Path.join(root, "src"), {
      recursive: true,
      ignoreDuplicatesMs: 50,
      ignoreSubsequent: production,
      reject: /\/\./,
    })

    watcher.on("add", ({ path }) => {
      if (globalPattern.test(path)) {
        addGlobal(absolute(path))
      }
      else {
        router.addFile(path)
      }
    })

    watcher.on("change", ({ path }) => {
      const [, type] = globalPattern.exec(path) || []
      if (globalPattern.test(path)) {
        changeGlobal(absolute(path))
      }
      else if (sourcePattern.test(path)) {
        loader.expire(absolute(path))
      }
      if (!production) server.publish("_live_reload_", "reload")
    })

    watcher.on("remove", ({ path }) => {
      const [, type] = globalPattern.exec(path) || []
      if (globalPattern.test(path)) {
        removeGlobal(absolute(path))
      }
      else if (sourcePattern.test(path)) {
        path = absolute(path)
        loader.expire(path)
        router.removeFile(path)
      }
      if (!production) server.publish("_live_reload_", "reload")
    })
  }

  async function addGlobal(path: string) {
    const module = await loader.module(path)
    const globals = new Set<string>()
    globalExtensions.set(path, globals)
    const dictionary = module.default ?? module
    for (const key in dictionary) {
      globals.add(key)
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: dictionary[key],
      })
    }
  }

  function changeGlobal(path: string) {
    removeGlobal(path)
    addGlobal(path)
  }

  function removeGlobal(path: string) {
    const globals = globalExtensions.get(path)!
    for (const key of globals) {
      delete (globalThis as any)[key]
    }
    globalExtensions.delete(path)
    loader.expire(path)
  }

  function absolute(path: string) {
    return Path.join(root, "src", path)
  }
}
