import defineGeneratedGlobals from "./generated/globals"
import { Primitives } from "./primitives"
import { print } from "./print"

defineGeneratedGlobals()

Object.defineProperty(globalThis, "print", { value: print })

const primitives = Primitives as any
for (const name in primitives) {
  Object.defineProperty(globalThis, name, { value: primitives[name] })
}

export default "ignore"
