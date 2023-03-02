import * as RegexParam from "regexparam"
import * as Path from "path"
import { print } from "@squirt/markup/src/print"
import { Loader } from "./loader"
import { Server } from "bun"

const routePattern = /^routes(\/?.*\/([^/]+))\.(html|css|api|socket)\.(ts|js|civet)$/
const contextPattern = /\.context\.(ts|js|civet)$/
const paramPattern = /\[([^\]]+)\]/g
const wildPattern = /\[\.\.\.(.+)\]$/
const unroutablePattern = /\/_/

export default async function createRouter(root: string, loader: Loader, production: boolean) {
  // TODO: route precedence
  const routes: Route[] = []
  const contextExtensions: Set<string> = new Set()

  return {
    addFile,
    removeFile,
    request,
    open,
    message,
    close,
    drain,
  }

  async function request(request: Request, server: Server): Promise<Response | null | undefined> {
    const url = new URL(request.url)
    const { route, parameters } = findRoute(url.pathname)
    if (route === null) return null

    const module = await loader.module(route.path)
    if (!module) return null
    const method = findMethod(route, module, request.method.toLowerCase())
    if (method === null) return null

    // TODO: different Context if type is socket
    let context: Context = {
      request,
      route,
      url,
    }
    
    for (const extension of contextExtensions) {
      const module = await loader.module(extension)
      const props = module.default(context)
      context = { ...props, ...context }
    }

    const result = (typeof method !== "function")
      ? method
      : await Promise.resolve(method(context, parameters))

    if (route.type === "api") {
      if (result instanceof Response) {
        return result
      }
      else {
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        })
      }
    }
    else if (route.type === "socket") {
      const handler = result as SocketHandler
      const upgrade = !handler.upgrade ? undefined : await Promise.resolve(handler.upgrade(request))
      const data: SquirtWebSocketData<unknown> = {
        type: "route",
        url: request.url,
        parameters: upgrade?.parameters
      }
      if (server.upgrade(request, { data, headers: upgrade?.headers })) {
        return undefined
      }
      else {
        return new Response("Expected WebSocket connection.", { status: 400 })
      }
    }
    else {
      const contentType = route.type === "html" ? "text/html" : "text/css"
      if (result instanceof Response) {
        return result
      }
      return new Response(print(result), {
        headers: { "Content-Type": contentType }
      })
    }
  }

  async function open(ws: SquirtWebSocket) {
    const handler = await findSocketHandler(ws)
    if (handler?.open) handler.open(ws)
  }

  async function message(ws: SquirtWebSocket, message: string | Uint8Array) {
    const handler = await findSocketHandler(ws)
    if (handler?.message) handler.message(ws, message)
  }

  async function close(ws: SquirtWebSocket, code: number, message: string) {
    const handler = await findSocketHandler(ws)
    if (handler?.close) handler.close(ws, code, message)
  }

  async function drain(ws: SquirtWebSocket) {
    const handler = await findSocketHandler(ws)
    if (handler?.drain) handler.drain(ws)
  }

  async function findSocketHandler(ws: SquirtWebSocket): Promise<SocketHandler | null> {
    if (ws.data.type !== "route") return null
    const url = new URL(ws.data.url)
    const { route, parameters } = findRoute(url.pathname)
    if (route === null) throw new Error("Could not route WebSocket.")

    const module = await loader.module(route.path)
    if (!module) throw new Error("Could not route WebSocket.")
    const method = module.default
    if (!method) throw new Error("Could not route WebSocket.")

    return (typeof method !== "function") ? method : await Promise.resolve(method(parameters, {
      route,
      url,
    }))
  }

  function findMethod(route: Route, module: any, method: string) {
    if (route.type === "css" || route.type === "socket") {
      return module.default || null
    }
    else if (route.type === "html") {
      if (method === "get") return module.default || module.get || null
      return module[method] || null
    }
    else if (route.type === "api") {
      if (module.default) return module.default
      if (method === "delete") return module.del || null
      return module[method] || null
    }
    return null
  }

  function findRoute(pathname: string) {
    const parameters: any = {}
    let match: Route | null = null
    for (const route of routes) {
      const matches = route.pattern.exec(pathname)
      if (matches) {
        match = route
        for (let p = 0; p < match.keys.length; p++) {
          parameters[route.keys[p]] = matches[p + 1]
        }
        break
      }
    }

    return {
      route: match,
      parameters,
    }
  }

  function addFile(path: string) {
    if (contextPattern.test(path)) {
      contextExtensions.add(absolute(path))
    }
    const route = createRoute(path)
    if (!route) return

    routes.push(route)
  }

  function removeFile(path: string) {
    contextExtensions.delete(path)
    const routeIndex = routes.findIndex(r => r.path === path)
    if (routeIndex > -1) {
      routes.splice(routeIndex, 1)
    }
  }

  function createRoute(path: string): Route | null {
    if (unroutablePattern.test(path)) return null

    const [, pattern, filename, type, language] = routePattern.exec(path) || []
    if (!pattern) return null

    let url = type === "css" ? pattern + ".css" :
      (filename === "index" ? pattern.substring(0, pattern.length - 5) : pattern)

    const [, wildKey] = wildPattern.exec(url) || []
    if (wildKey) {
      url = url.replace(wildPattern, "*")
    }

    const isParam = paramPattern.test(url)
    if (isParam) {
      url = url.replace(/\[([^\]]+)\]/g, ":$1")
    }

    const route: Route = {
      path: absolute(path),
      type,
      language,
      isParam,
      isWild: !!wildKey,
      ...RegexParam.parse(url),
    }
    if (wildKey) {
      route.keys[route.keys.length - 1] = wildKey
    }
    return route
  }

  function absolute(path: string) {
    return Path.join(root, "src", path)
  }
}
