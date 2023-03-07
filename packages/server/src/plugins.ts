Bun.plugin({
  name: "civet",
  async setup(builder) {
    const { compile } = await import("@danielx/civet")
    const { readFileSync } = await import("fs")

    builder.onLoad({ filter: /\.civet$/ }, ({ path }) => ({
      loader: "ts",
      contents: compile(readFileSync(path, "utf8"))
    }))
  },
})

Bun.plugin({
  name: "assets",
  async setup(builder) {
    const { readFileSync, statSync, readdirSync } = await import("fs")
    const { resolve, parse } = await import("path")

    builder.onResolve({ namespace: "assets", filter: /.*/ }, ({ path }) => {
      return {
        path: resolve("assets", path),
        namespace: "assets"
      }
    })

    builder.onLoad({ namespace: "assets", filter: /.*/ }, ({ path }) => {
      const stats = statSync(path)
      if (stats.isFile()) {
        return {
          loader: "object",
          exports: { default: readFileSync(path, "utf8") }
        }
      }
      const files = readdirSync(path)
        .filter(file => statSync(resolve(path, file)).isFile())
        .map(file => [file.replace(/\..+$/, ""), readFileSync(resolve(path, file), "utf8")])
      return {
        loader: "object",
        exports: { default: Object.fromEntries(files) }
      }
    })
  },
})

// NOTE: don't import .css right now :) https://github.com/oven-sh/bun/issues/2200
Bun.plugin({
  name: "css",
  async setup(builder) {
    const { readFileSync } = await import("fs")

    builder.onResolve({ filter: /\.css$/ }, ({ path, importer }) => {
      const absolute = Bun.resolveSync(path.replace(/\.css$/, ".js"), importer).replace(/\.js$/, ".css")
      return {
        path: absolute,
        namespace: "css",
      }
    })

    builder.onLoad({ filter: /\.css$/, namespace: "css" }, ({ path }) => {
      const css = readFileSync(path, "utf8")
      return {
        loader: "object",
        exports: { default: css },
      }
    })
  },
})