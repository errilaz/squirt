import { listAll as getCssRefs } from "@webref/css"
import { all as knownCssProperties } from "known-css-properties"
import { definitionSyntax } from "css-tree"

export default async function getCssSymbols() {
  const properties: SpecProperty[] = []
  const propLookup: Record<string, SpecProperty | undefined> = {}

  // Collect properties from @webref/css

  const refs = await getCssRefs()

  const excludedTypes = [
    "length",
    "angle",
    "time",
    "frequency",
    "resolution",
  ]

  const excludedValues = excludedTypes.flatMap(valueType => {
    return refs["css-values"].values
      ?.find(value => value.name === `<${valueType}>`)
      ?.values?.map(v => v.name)!
  }).concat("color")

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
                addValue(property!, "keyword", node.name, spec, help)
              }
              else if (node.type === "Type" && node.name === "color") {
                const help = refProp.values?.find(v => v.name === node.name)?.prose
                addValue(property!, "color", node.name, spec, help)
              }
              else if (node.type === "Type") {
                const valuesType = findValuesType(node.name)
                if (valuesType) {
                  for (const value of valuesType.values!) {
                    if (value.name.includes("<") || value.name.includes("(")) continue
                    if (excludedValues.includes(value.name)) continue
                    addValue(property!, "keyword", value.name, spec, value.prose)
                  }
                }
              }
            }
          })
        }
      }
    }
  }

  // Collect properties from known-css-properties

  const unknownSpec: Spec = {
    title: "Unknown Specification",
    shortName: "unknown-spec",
  }

  for (const name of knownCssProperties) {
    if (propLookup.hasOwnProperty(name)) continue
    if (name.startsWith("-epub")) continue

    properties.push({
      name,
      jsName: camelize(jsName(name)),
      specs: [unknownSpec],
      values: [],
    })
  }
  
  // Sort properties

  properties.sort((a, b) => a.name.localeCompare(b.name))

  // Collect colors

  const colors = refs["css-color"].values!
    .find(v => v.name === "<color>")!
    .values!
    .map(v => v.name)
    .filter(c => c !== "none")

  // Collect Atrules

  const atrulesDefined: { [name: string]: boolean | undefined } = {}
  const atrules = Object.keys(refs)
    .flatMap(key => refs[key].atrules)
    .map(atrule => ({
      name: atrule.name.substring(1),
      jsName: camelize(jsName(atrule.name.substring(1))),
      help: atrule.prose,
    }))
    .filter(atrule => {
      const duplicate = !!atrulesDefined[atrule.name]
      atrulesDefined[atrule.name] = true
      return !duplicate
    })

  return {
    properties,
    colors,
    atrules,
  }

  function findValuesType(name: string) {
    for (const shortName in refs) {
      const ref = refs[shortName]
      for (const refValue of ref.values || []) {
        if (refValue.name === `<${name}>` && refValue.values) {
          return refValue
        }
      }
    }
    return undefined
  }
}

function addValue(property: SpecProperty, type: SpecValue["type"], name: string, spec: Spec, help: string | undefined) {
  const original = property.values.find(v => v.name === name)
  if (!original) {
    property!.values.push({
      type,
      name: name,
      jsName: camelize(jsName(name)),
      helps: [{ spec, help }],
    })
  }
  else {
    original.helps.push({ spec, help: help === original.helps[0].help ? undefined : help })
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
  type: "keyword" | "color"
  helps: SpecValueHelp[]
}

export interface SpecValueHelp {
  spec: Spec
  help?: string
}

export interface SpecAtrule {
  name: string
  jsName: string
  help?: string
}

const keywords = ["continue", "default", "super", "break", "in"]

/** Formats a variable name. */
function jsName(property: string) {
  switch (true) {
    case keywords.includes(property):
      return `_${property}`
    case property.startsWith("-"):
      return property.substring(1)
  }
  return property.replace(" ", "_")
}

/** Turn a kebab-case name into camelCase. */
function camelize(kebab: string) {
  return kebab.replace(/-./g, ([, c]) => c.toUpperCase());
}
