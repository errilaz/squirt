import tags from "html-tags"
import voids from "html-tags/void"

const keywords = ["var"]

export default async function getHtmlSymbols() {
  return tags.map(name => ({
    name,
    isVoid: (voids as string[]).includes(name),
    jsName: keywords.includes(name) ? `_${name}` : name,
    help: `Create a virtual \`${name}\` HTML element.`,
  }))
}


export interface ElementSpec {
  name: string
  isVoid: boolean
  jsName: string
  help: string
}