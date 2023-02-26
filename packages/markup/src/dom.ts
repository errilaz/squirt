export type ElementBuilder = ((...contents: any[]) => Element) & {
  [className: string]: ElementBuilder
}

/** Representation of an HTML element. */
export class Element {
  tag: string
  isVoid: boolean
  attributes: { [name: string]: string } = {}
  properties: { [name: string]: string } = {}
  children: any[] = []

  constructor(tag: string, isVoid: boolean, contents: any[]) {
    this.tag = tag
    this.isVoid = isVoid
    for (const content of contents) {
      this.add(content)
    }
  }

  add(content: any) {
    if (isEmpty(content)) return
    else if (isChildObject(content)) {
      this.children.push(content)
    }
    else if (content instanceof Property) {
      this.properties[content.name] = content.value
    }
    else if (Array.isArray(content)) {
      for (const element of content) {
        this.add(element)
      }
    }
    else if (typeof content === "object") {
      for (const key in content) {
        if (this.attributes[key]) {
          this.attributes[key] += " " + content[key].toString()
        }
        else {
          this.attributes[key] = content[key].toString()
        }
      }
    }
    else {
      this.children.push(content.toString())
    }
  }
}

/** Representation of a CSS property/value. */
export class Property {
  name: string
  value: string

  constructor(name: string, value: any) {
    this.name = name
    this.value = value
  }
}

/** Representation of a CSS rule. */
export class Rule {
  selector: string
  properties: { [name: string]: string } = {}
  rules: Rule[] = []

  constructor(selector: string, contents: (Property | Rule | any[])[]) {
    this.selector = selector
    for (const content of contents) {
      this.add(content)
    }
  }

  add(content: Property | Rule | any[]) {
    if (Array.isArray(content)) {
      for (const piece of content) {
        this.add(piece)
      }
    }
    else if (content instanceof Property) {
      this.properties[content.name] = content.value
    }
    else if (content instanceof Rule) {
      this.rules.push(content)
    }
  }
}

/** Represents at-rules. */
export class AtRule {
  keyword: string
  rule: string | null
  properties: { [name: string]: string } = {}
  contents: any[] = []

  constructor(keyword: string, rule: string | null, contents: any[]) {
    this.keyword = keyword
    this.rule = rule
    for (const content of contents) {
      this.add(content)
    }
  }

  add(content: Property | Rule) {
    if (content instanceof Property) {
      this.properties[content.name] = content.value
    }
    else {
      this.contents.push(content)
    }
  }
}

/** Unescaped HTML content. */
export class Raw {
  text: string

  constructor(object: any) {
    this.text = object === null || object === undefined ? "" : object.toString()
  }
}

function isEmpty(x: any) {
  return x === undefined
    || x === null
    || x === ""
    || x === false
}

function isChildObject(x: any) {
  return x === true
    || x instanceof Element
    || x instanceof Rule
    || x instanceof Raw
    || x instanceof AtRule
}
