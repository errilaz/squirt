import { AtRule, Element, Property } from "./dom"

export module Factory {

  /** Factory for Element instances with CSS class name proxies wrapping them. */
  export function element(tag: string, isVoid: boolean) {
    return new Proxy(createElement, { get: withClass })

    function createElement(...contents: any[]): Element {
      return new Element(tag, isVoid, contents)
    }

    function withClass(obj: any, cssClass: string) {
      if (cssClass === "__tag__") {
        return tag
      }
      cssClass = kebabize(cssClass)
      const proxy = new Proxy(createElement.bind(null, { class: cssClass }), {
        get: withAnotherClass
      })
      Object.defineProperty(proxy, "_cssClass", {
        value: cssClass,
        enumerable: false
      })
      return proxy
    }

    function withAnotherClass(obj: any, cssClass: string): Element {
      cssClass = kebabize(cssClass)
      const classes = [obj._cssClass, cssClass].join(" ")
      const proxy = new Proxy(createElement.bind(null, { class: classes }), {
        get: withAnotherClass
      })
      Object.defineProperty(proxy, "_cssClass", {
        value: classes,
        enumerable: false
      })
      return proxy
    }
  }

  /** Factory for named properties. */
  export function property(name: string) {
    return function property(value: any) {
      return new Property(name, value)
    }
  }

  /** Helper for generated property modules. */
  export function propertyValue(name: string, value: any) {
    return new Property(name, value)
  }

  /** Factory at-rules. */
  export function atRule(keyword: string) {
    return function nestedAtRule(...contents: any[]) {
      let rule = null
      if (typeof contents[0] === "string") {
        rule = contents[0]
        contents = contents.slice(1)
      }
      return new AtRule(keyword, rule, contents)
    }
  }
}

/** Transform camelCase name into kebab-case. */
function kebabize(camel: string) {
  return camel.replace(/[A-Z]/g, c => "-" + c.toLowerCase());
}
