export type Loader = ReturnType<typeof createLoader>
export default function createLoader() {
  const tracked: { [specifier: string]: boolean } = {}
  const dependantLookup: { [specifier: string]: string[] } = {}
  const globalExtensions = new Map<string, Set<string>>()

  return {
    module,
    expire,
    purge,
    globalExtensions,
    addGlobal,
    changeGlobal,
    removeGlobal,
  }

  async function module(specifier: string) {
    const module = await import(specifier)
    if (!tracked[specifier]) {
      track(specifier)
    }
    return module
  }

  function track(specifier: string) {
    tracked[specifier] = true
    for (const dependency of Loader.dependencyKeysIfEvaluated(specifier)) {
      if (/(\/node_modules\/)|(bun:)/.test(dependency)) continue
      let dependants = dependantLookup[dependency]
      if (!dependants) dependants = dependantLookup[dependency] = []
      dependants.push(specifier)
      track(dependency)
    }
  }

  async function expire(specifier: string, purging = false) {
    Loader.registry.delete(specifier)
    delete tracked[specifier]
    if (!purging && globalExtensions.has(specifier)) {
      await purge()
      return
    }
    const dependants = dependantLookup[specifier]
    if (dependants) {
      delete dependantLookup[specifier]
      for (const dependant of dependants) {
        await expire(dependant)
      }
    }
  }

  async function purge() {
    for (const globals of globalExtensions.values()) {
      for (const key of globals) {
        delete (globalThis as any)[key]
      }
    }
    for (const specifier in tracked) {
      await expire(specifier, true)
    }
    for (const specifier of globalExtensions.keys()) {
      await addGlobal(specifier)
    }
  }

  async function addGlobal(path: string) {
    const globalModule = await module(path)
    const globals = new Set<string>()
    globalExtensions.set(path, globals)
    const dictionary = globalModule.default ?? globalModule
    for (const key in dictionary) {
      globals.add(key)
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: dictionary[key],
      })
    }
  }

  async function changeGlobal(path: string) {
    await removeGlobal(path)
    await addGlobal(path)
  }

  async function removeGlobal(path: string) {
    const globals = globalExtensions.get(path)!
    for (const key of globals) {
      delete (globalThis as any)[key]
    }
    globalExtensions.delete(path)
    await expire(path)
  }
}
