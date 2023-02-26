import "./generated/definitions"

declare global {
  function print(x: any): string
  function elem(tag: string, ...contents: any[]): Element
  function rule(selector: string, ...contents: (Property | Rule)[]): Rule
  function prop(name: string, value: any): Property
  function raw(object: any): Raw
  function quote(text: string): string
  function liveReload(enabled?: boolean): Element | null
  const doctype: { html5: Raw }
}
