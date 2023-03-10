import * as Path from "path"
import watch from "inwatch"
import { Server } from "bun"
import "@squirt/markup/src/globals.ts"
import "./plugins"
import createRouter from "./router"
import createLoader from "./loader"
import defineGlobals from "./globals"
import serveStatic from "serve-static-bun"
import errorPage from "./error"

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
  
  if (!production) setTimeout(() => {
    liveReload()
  }, 2100)

  return server

  async function fetch(request: Request) {
    console.log(request.method, request.url)
    try {
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
    catch (error) {
      console.error(error)
      return new Response(render(errorPage(request, error)), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      })
    }
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

    watcher.on("add", async ({ path }) => {
      if (globalPattern.test(path)) {
        await loader.addGlobal(absolute(path))
      }
      else {
        router.addFile(path)
      }
    })

    watcher.on("change", async ({ path }) => {
      if (globalPattern.test(path)) {
        await loader.changeGlobal(absolute(path))
      }
      else {
        await loader.expire(absolute(path))
      }
      liveReload()
    })

    watcher.on("remove", async ({ path }) => {
      if (globalPattern.test(path)) {
        await loader.removeGlobal(absolute(path))
      }
      else {
        path = absolute(path)
        await loader.expire(path)
        router.removeFile(path)
      }
      liveReload()
    })
  }

  function liveReload() {
    if (!production) {
      server.publish("_live_reload_", "reload")
    }
  }

  function absolute(path: string) {
    return Path.join(root, "src", path)
  }
}
