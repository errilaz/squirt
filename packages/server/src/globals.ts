import { Element, Raw } from "@squirt/markup/src/dom"
import * as Path from "path"

export default function defineGlobals(root: string, production: boolean) {
  Object.defineProperty(globalThis, "root", { value: root })
  Object.defineProperty(globalThis, "production", { value: production })
  Object.defineProperty(globalThis, "development", { value: !production })
  Object.defineProperty(globalThis, "liveReload", { value: liveReload })
  Object.defineProperty(globalThis, "redirect", { value: redirect })
}

function redirect(location: string, temporary = false) {
  return new Response(null, {
    status: temporary ? 307 : 302,
    headers: {
      Location: location
    },
  })
}

const liveReloadJs = await Bun.file(Path.join(import.meta.dir, "liveReload.js")).text()

/** Live reload script. TODO: move to @squirt/server */
function liveReload(enabled?: boolean) {
  if (enabled === false) return null
  return new Element("script", false, [new Raw(liveReloadJs)])
}
