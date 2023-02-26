import { AtRule, Element, Raw, Rule } from "./dom"

/** State for `print`. */
interface Printer { text: string }

/** Render HTML content. */
export function print(x: any) {
  const printer = { text: "" }
  printNode(x, printer)
  return printer.text
}

/** Render an object */
function printNode(x: any, p: Printer) {
  const type = typeof x
  switch (true) {
    case x === undefined || x === null || x === "" || x === false:
      break
    case type === "string":
    case type === "number":
    case type === "boolean":
    case type === "bigint":
      p.text += Bun.escapeHTML(x)
      break
    case x instanceof Raw:
      p.text += x.text
      break
    case Array.isArray(x):
      for (const e of x)
        printNode(e, p)
      break
    case x instanceof Element: {
      p.text += `<${x.tag}`
      const attributes = Object.keys(x.attributes)
        .map(key => `${key}="${x.attributes[key]}"`)
        .join(" ")
      if (attributes.length > 0) p.text += " " + attributes
      const properties = Object.keys(x.properties)
        .map(key => `${key}: ${x.properties[key]}`)
        .join(";")
      if (properties.length > 0) {
        p.text += ` style="${properties}"`
      }
      p.text += `>`
      if (x.isVoid) {
        break
      }
      for (const child of x.children) {
        printNode(child, p)
      }
      p.text += `</${x.tag}>`
      break
    }
    case x instanceof Rule: {
      printRule(x, p)
      break
    }
    case x instanceof AtRule: {
      p.text += `@${x.keyword}`
      if (x.rule !== null) {
        p.text += ` ${x.rule}`
      }
      if (x.contents.length === 0 && Object.keys(x.properties).length === 0) {
        p.text += ";"
        break
      }
      p.text += "{"
      p.text += Object.keys(x.properties)
        .map(key => `${key}:${x.properties[key]}`)
        .join(";")
      for (const content of x.contents) {
        printNode(content, p)
      }
      p.text += "}"
      break
    }
  }
}

/** Render a CSS rule (and any nested rules). */
function printRule(rule: Rule, p: Printer, prefix?: string) {
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
    p.text += `${selectors.join(",")}{`
    p.text += Object.keys(rule.properties)
      .map(key => `${key}:${rule.properties[key]}`)
      .join(";")
    p.text += `}`
  }

  if (rule.rules.length === 0) return
  for (const selector of selectors) {
    for (const sub of rule.rules) {
      printRule(sub, p, selector)
    }
  }
}