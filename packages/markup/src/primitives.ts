import cssesc from "cssesc"
import { Element, Property, Raw, Rule } from "./dom"

export module Primitives {

  /** Custom element helper. */
  export function elem(tag: string, ...contents: any[]) {
    return new Element(tag, false, contents)
  }

  /** Constructs a CSS rule. */
  export function rule(selector: string, ...contents: (Property | Rule)[]) {
    return new Rule(selector, contents)
  }

  /** Custom property helper. */
  export function prop(name: string, value: any) {
    return new Property(name, value)
  }

  /** Creates an instance of Raw. */
  export function raw(object: any) {
    return new Raw(object)
  }

  /** Escapes and wraps a CSS string. */
  export function quote(text: string) {
    return `"${cssesc(text, { quotes: "double" })}"`
  }

  export const doctype = {
    html5: raw("<!DOCTYPE html>")
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
}
