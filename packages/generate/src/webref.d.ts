declare module "@webref/elements" {
  export function listAll(): Promise<Record<string, ElementsReference>>

  export interface ElementsReference {
    spec: {
      title: string
      url: string
    }
    elements: RefElement[]
  }

  export interface RefElement {
    name: string
    interface: string
  }
}

declare module "@webref/css" {
  export function listAll(): Promise<Record<string, CssReference>>

  export interface CssReference {
    spec: {
      title: string
      url: string
    },
    properties: RefProperty[]
    atrules: RefAtrule[]
    selectors: any[]
    warnings?: any[]
    values?: RefValue[]
  }

  export interface RefProperty {
    name: string
    value?: string
    initial: string
    appliesTo: string
    inherited: string
    percentages: string
    computedValue: string
    canonicalOrder: string
    media: string
    values?: RefValue[]
    styleDeclaration: string[]
  }

  export interface RefAtrule {
    name: string
    descriptors: RefAtruleDescriptor[]
    value: string
  }

  export interface RefAtruleDescriptor {
    name: string
    for: string
    value: string
    initial: string
    values?: RefValue[]
  }

  export interface RefValue {
    name: string
    type: string
    value?: string
    prose?: string
    values?: RefValue[]
  }
}
