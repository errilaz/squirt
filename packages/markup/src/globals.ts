import defineHtmlGlobals from "./generated/html.define"
import defineCssGlobals from "./generated/css.define"
import { Primitives } from "./primitives"
import { render } from "./render"

defineHtmlGlobals()
console.log(defineCssGlobals)
defineCssGlobals()

Object.defineProperty(globalThis, "render", { value: render })

const primitives = Primitives as any
for (const name in primitives) {
  Object.defineProperty(globalThis, name, { value: primitives[name] })
}

export default "ignore"
