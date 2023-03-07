import cssesc from "cssesc"
import { Element, Property, Raw, Rule } from "./dom"

export module Primitives {

  /** Custom element helper. */
  export function elem(tag: string, ...contents: any[]) {
    return new Element(tag, false, contents)
  }

  /** Constructs a CSS rule. */
  export const rule = new Proxy(createRule, {
    get: createClassRule
  })

  function createRule(selector: string, ...contents: (Property | Rule)[]) {
    return new Rule(selector, contents)
  }

  function createClassRule(obj: any, cssClass: string) {
    return function createClassRule(...contents: (Property | Rule)[]) {
      return new Rule(`.${cssClass}`, contents)
    }
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
}
