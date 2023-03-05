import { listAll as getCssRefs } from "@webref/css"
import { all as knownCssProperties } from "known-css-properties"
import { definitionSyntax } from "css-tree"

export default async function getCssSymbols() {
  const properties: SpecProperty[] = []
  const propLookup: Record<string, SpecProperty | undefined> = {}

  const refs = await getCssRefs()
  
  for (const shortName in refs) {
    const ref = refs[shortName]
    const spec: Spec = {
      shortName: shortName.toLowerCase(),
      title: ref.spec.title,
    }

    for (const refProp of ref.properties) {
      let property = propLookup[refProp.name]
      if (!property) {
        property = propLookup[refProp.name] = {
          name: refProp.name,
          jsName: camelize(jsName(refProp.name)),
          specs: [],
          values: [],
        }
        properties.push(property)
      }
      property.specs.push(spec)

      if (refProp.value) {
        const values = definitionSyntax.parse(refProp.value)
        for (const refValue of values.terms) {
          definitionSyntax.walk(refValue, {
            enter(node) {
              if (node.type === "Keyword" && /^[a-z]/.test(node.name)) {
                const help = refProp.values?.find(v => v.name === node.name)?.prose
                property!.values.push({
                  type: "keyword",
                  name: node.name,
                  jsName: camelize(jsName(node.name)),
                  help,
                  spec,
                })
              }
              else if (node.type === "Type" && node.name === "color") {
                const help = refProp.values?.find(v => v.name === node.name)?.prose
                property!.values.push({
                  type: "color",
                  name: node.name,
                  jsName: camelize(jsName(node.name)),
                  help,
                  spec,
                })
              }
            }
          })
        }
      }
    }
  }

  function findValueType(name: string) {
    for (const shortName in refs) {
      const ref = refs[shortName]
      for (const refValue of ref.values || []) {
        if (refValue.name === `<${name}>`) {
          return refValue
        }
      }
    }
    return undefined
  }

  const unknownSpec: Spec = {
    title: "Unknown Specification",
    shortName: "unknown",
  }

  for (const name of knownCssProperties) {
    if (propLookup.hasOwnProperty(name)) continue

    properties.push({
      name,
      jsName: camelize(jsName(name)),
      specs: [unknownSpec],
      values: [],
    })
  }

  properties.sort((a, b) => a.name.localeCompare(b.name))

  return {
    properties,
  }
}

export interface Spec {
  title: string
  shortName: string
}

export interface SpecProperty {
  name: string
  jsName: string
  specs: Spec[]
  values: SpecValue[]
}

export interface SpecValue {
  name: string
  jsName: string
  spec: Spec
  type: "keyword" | "color"
  help?: string
}

const keywords = ["continue", "default", "super", "break"]

/** Formats a variable name. */
function jsName(property: string) {
  switch (true) {
    case keywords.includes(property):
      return `_${property}`
    case property.startsWith("-"):
      return property.substring(1)
  }
  return property
}

/** Turn a kebab-case name into camelCase. */
function camelize(kebab: string) {
  return kebab.replace(/-./g, ([, c]) => c.toUpperCase());
}
