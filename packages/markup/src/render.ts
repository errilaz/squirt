import { AtRule, Element, Raw, Rule } from "./dom"

/** State for `render`. */
interface Renderer { text: string }

/** Render HTML content. */
export function render(x: any) {
  const renderer = { text: "" }
  renderNode(x, renderer)
  return renderer.text
}

/** Render an object */
function renderNode(x: any, r: Renderer) {
  const type = typeof x
  switch (true) {
    case x === undefined || x === null || x === "" || x === false:
      break
    case type === "string":
    case type === "number":
    case type === "boolean":
    case type === "bigint":
      r.text += Bun.escapeHTML(x)
      break
    case x instanceof Raw:
      r.text += x.text
      break
    case Array.isArray(x):
      for (const e of x)
        renderNode(e, r)
      break
    case x instanceof Element: {
      r.text += `<${x.tag}`
      const attributes = Object.keys(x.attributes)
        .map(key => `${key}="${x.attributes[key]}"`)
        .join(" ")
      if (attributes.length > 0) r.text += " " + attributes
      const properties = Object.keys(x.properties)
        .map(key => `${key}: ${x.properties[key]}`)
        .join(";")
      if (properties.length > 0) {
        r.text += ` style="${properties}"`
      }
      r.text += `>`
      if (x.isVoid) {
        break
      }
      for (const child of x.children) {
        renderNode(child, r)
      }
      r.text += `</${x.tag}>`
      break
    }
    case x instanceof Rule: {
      renderRule(x, r)
      break
    }
    case x instanceof AtRule: {
      r.text += `@${x.keyword}`
      if (x.rule !== null) {
        r.text += ` ${x.rule}`
      }
      if (x.contents.length === 0 && Object.keys(x.properties).length === 0) {
        r.text += ";"
        break
      }
      r.text += "{"
      r.text += Object.keys(x.properties)
        .map(key => `${key}:${x.properties[key]}`)
        .join(";")
      for (const content of x.contents) {
        renderNode(content, r)
      }
      r.text += "}"
      break
    }
  }
}

/** Render a CSS rule (and any nested rules). */
function renderRule(rule: Rule, r: Renderer, prefix?: string) {
  let selectors = rule.selector.split(",").map(s => s.trim())
  if (prefix) {
    selectors = selectors.map(selector => {
      if (selector.startsWith("&")) {
        return prefix + selector.substring(1)
      }
      else if (selector.startsWith(":")) {
        return prefix + selector
      }
      else {
        return prefix + " " + selector
      }
    })
  }
  const keys = Object.keys(rule.properties)
  if (keys.length > 0) {
    r.text += `${selectors.join(",")}{`
    r.text += Object.keys(rule.properties)
      .map(key => `${key}:${rule.properties[key]}`)
      .join(";")
    r.text += `}`
  }

  if (rule.rules.length === 0) return
  for (const selector of selectors) {
    for (const sub of rule.rules) {
      renderRule(sub, r, selector)
    }
  }
}