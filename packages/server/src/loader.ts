export type Loader = ReturnType<typeof createLoader>
export default function createLoader() {
  const tracked: { [specifier: string]: boolean } = {}
  const dependantLookup: { [specifier: string]: string[] } = {}

  return {
    module,
    expire,
    purge,
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
      let dependants = dependantLookup[dependency]
      if (!dependants) dependants = dependantLookup[dependency] = []
      dependants.push(specifier)
      track(dependency)
    }
  }

  function expire(specifier: string) {
    Loader.registry.delete(specifier)
    delete tracked[specifier]
    const dependants = dependantLookup[specifier]
    if (dependants) {
      delete dependantLookup[specifier]
      for (const dependant of dependants) {
        expire(dependant)
      }
    }
  }

  function purge() {
    for (const specifier in tracked) {
      expire(specifier)
    }
  }
}