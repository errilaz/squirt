import defineGeneratedGlobals from "./generated/globals"
import { Primitives } from "./primitives"
import { render } from "./render"

defineGeneratedGlobals()

Object.defineProperty(globalThis, "render", { value: render })

const primitives = Primitives as any
for (const name in primitives) {
  Object.defineProperty(globalThis, name, { value: primitives[name] })
}

export default "ignore"
