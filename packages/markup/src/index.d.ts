import "./generated/html.types"
import "./generated/css.types"
import type { Property, Rule } from "./dom"

declare global {
  function render(x: any): string
  function elem(tag: string, ...contents: any[]): Element
  const rule: ((selector: string, ...contents: (Property | Rule)[]) => Rule)
    & { [cssClass: string]: (...contents: (Property | Rule)[]) => Rule }
  function prop(name: string, value: any): Property
  function raw(object: any): Raw
  function quote(text: string): string
  const doctype: { html5: Raw }
}
