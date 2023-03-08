import "./generated/html.types"
import "./generated/css.types"
import type { Property, Rule } from "./dom"

declare global {
  /** Render content to HTML/CSS. */
  function render(x: any): string
  /** Create an HTML element with a custom tag name. */
  function elem(tag: string, ...contents: any[]): Element
  /** Create a CSS rule. The selector can be a string or element function, or you can use the `rule.myClass` syntax. */
  const rule: ((selector: string | ElementBuilder, ...contents: (Property | Rule)[]) => Rule)
    & { [cssClass: string]: (...contents: (Property | Rule)[]) => Rule }
  /** Create a CSS property with a custom name. */
  function prop(name: string, value: any): Property
  /** Render an object without HTML escaping. */
  function raw(object: any): Raw
  /** Quote and escape a string for use in a CSS value. */
  function quote(text: string): string
  /** Create a DOCTYPE declaration. */
  const doctype: { html5: Raw }
}
