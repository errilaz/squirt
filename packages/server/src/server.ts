import * as Path from "path"
import watch from "inwatch"
import { Server } from "bun"
import "@squirt/markup/src/globals.ts"
import "./plugins"
import createRouter from "./router"
import createLoader from "./loader"
import defineGlobals from "./globals"

const sourcePattern = /\.(tsx?|jsx?|civet|json|toml)$/
const globalsPattern = /^common\/globals\.(tsx?|jsx?|civet)$/

export default async function createServer(root: string, production = false) {
  const globals: Set<string> = new Set()
  const loader = createLoader()
  const router = await createRouter(root, loader, production)
  createWatcher()

  const server: Server = Bun.serve({
    port: 3000,
    fetch,
    websocket: {
      open,
      message: router.message,
      close: router.close,
      drain: router.drain,
    }
  })

  defineGlobals(root, production)

  console.log(`== squirt listening on :${server.port} at "${root}"`)
  return server

  async function fetch(request: Request) {
    console.log(request.method, request.url)
    const url = new URL(request.url)
    if (!production && url.pathname === "/_live_reload_") {
      return await connectLiveReload(request)
    }
    const response = await router.request(request, server)
    if (response === null) {
      return new Response("Not found.", { status: 404 })
    }
    // TODO: serve /public
    return response
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
      reject: /\/\./,
      // skipSubsequent: production,
    })

    watcher.on("add", ({ path }) => {
      if (globalsPattern.test(path)) {
        addGlobals(absolute(path))
      }
      else {
        router.addFile(path)
      }
    })

    watcher.on("change", ({ path }) => {
      if (globalsPattern.test(path)) {
        console.log("reloading globals")
        purgeGlobals()
        loader.expire(path)
        addGlobals(absolute(path))
      }
      else if (sourcePattern.test(path)) {
        loader.expire(absolute(path))
      }
      if (!production) server.publish("_live_reload_", "reload")
    })

    watcher.on("remove", ({ path }) => {
      if (globalsPattern.test(path)) {
        purgeGlobals()
        loader.expire(path)
      }
      else if (sourcePattern.test(path)) {
        path = absolute(path)
        loader.expire(path)
        router.removeFile(path)
      }
      if (!production) server.publish("_live_reload_", "reload")
    })
  }

  async function addGlobals(path: string) {
    const module = await loader.module(path)
    for (const key in module.default) {
      globals.add(key)
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: module.default[key],
      })
    }
  }

  async function purgeGlobals() {
    for (const key of globals.keys()) {
      delete (globalThis as any)[key]
    }
    globals.clear()
    loader.purge()
  }

  function absolute(path: string) {
    return Path.join(root, "src", path)
  }
}
