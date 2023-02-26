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