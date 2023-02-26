import { Element, Raw } from "@squirt/markup/src/dom"

export default function defineGlobals(root: string, production: boolean) {
  Object.defineProperty(globalThis, "root", { value: root })
  Object.defineProperty(globalThis, "production", { value: production })
  Object.defineProperty(globalThis, "development", { value: !!production })
  Object.defineProperty(globalThis, "liveReload", { value: liveReload })
}

/** Live reload script. TODO: move to @squirt/server */
export function liveReload(enabled?: boolean) {
  if (enabled === false) return null
  return new Element("script", false, [new Raw(`
    (function() {
      const url = new URL(document.location.toString())
      url.protocol = url.protocol === "http:" ? "ws:" : "wss:"
      url.pathname = "_live_reload_"
      const ws = new WebSocket(url)
      ws.addEventListener("message", event => {
        if (event.data === "reload") {
          document.location.reload()
        }
      })
    })()
  `)])
}
