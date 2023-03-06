import getCssSymbols, { Spec, SpecValue } from "./css"

await Promise.all([
  writeCss(),
])

async function writeCss() {
  const { types, define } = await generateCss()
  return Promise.all([
    Bun.write("src/generated/types.css.d.ts", types),
    Bun.write("src/generated/define.css.ts", define),
  ])
}

async function generateCss() {
  const { properties, colors, atrules } = await getCssSymbols()

  // Header
  let types = "// GENERATED by @squirt/generator\n"
  let define = "// GENERATED BY @squirt/generator\n"

  // Imports
  types += `import type { ElementBuilder, Property, AtRule } from "../dom"\n\n`
  define += `import { Factory } from "../factory"\n\n`

  // Module
  types += "declare global {\n"
  define += "export default function defineCssGlobals() {\n"

  // NamedColor Type
  types += `  interface NamedColor {\n`
  types += colors.map(color => `    ${color}: Property`).join("\n")
  types += `\n  }\n\n`

  // Atrules
  types += `  // Atrules\n\n`
  for (const atrule of atrules) {
    types += `  /** ${atrule.help ?? `\`${atrule.name}\` atrule.`} */\n`
    types += `  function $${atrule.jsName}(...contents: any[]): AtRule\n\n`
  }

  // Properties
  types += `  // Properties\n\n`
  for (const property of properties) {
    const hasColor = property.values.some(v => v.type === "color")
    const onlyColors = property.values.every(v => v.type === "color")
    types += `  /** Create a \`${property.name}\` property. \`${printSpecs(property)}\` */\n`
    types += `  const ${property.jsName}: ((value: any) => Property)${hasColor ? " & NamedColor" : ""}\n`
    define += `  Object.defineProperty(globalThis, "${property.jsName}", { value: Factory.property("${property.name}")})\n`
    if (property.values.length > 0) {
      if (!onlyColors) types += `  module ${property.jsName} {\n`
      for (const value of property.values) {
        if (value.type === "keyword") {
          types += `    /** ${printValueHelp(value)} */\n`
          types += `    const ${value.jsName}: string\n`
          define += `  Object.defineProperty((globalThis as any).${property.jsName}, "${value.jsName}", { value: Factory.propertyValue("${property.name}", "${value.name}") })\n`
        }
        else if (value.type === "color") {
          for (const color of colors) {
            define += `  Object.defineProperty((globalThis as any).${property.jsName}, "${color}", { value: Factory.propertyValue("${property.name}", "${color}") })\n`
          }
        }
      }
      if (!onlyColors) types += `  }\n`
    }
    types += `\n`
  }

  // Close Module
  define += "}\n"
  types += "}\n"

  return { types, define }
}

function printSpecs({ specs }: { specs: Spec[] }) {
  return specs.map(s => s.shortName).join(", ")
}

function printValueHelp(value: SpecValue) {
  if (value.helps.length === 1) {
    return `${value.helps[0].help ?? "`" + value.name + "` keyword"}. \`${value.helps[0].spec.shortName}\``
  }
  return value.helps
    .map(help => `\`${help.spec.shortName}\`: ${help.help ?? "`" + value.name + "` keyword."}`)
    .join("\n\n    ")
}