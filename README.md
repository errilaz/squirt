<img src="logo.png" width="200" height="200">

# Squirt

> HTML OVER THE WIRE ON THE BUN 

Squirt is a (🚧 pre-alpha 🚧) do-everything SSR/HOTW/AHAH server and framework built on [Bun](https://bun.sh).

- [Civet](https://civet.dev) support
- Next/Astro style filesystem routing
- Live reload
- Hyperscript-style HTML/CSS (all elements, properties, and at-rules are available on `globalThis` 😆)
- SOON: tiny client-side runtime for declarative interactivity

## Routing

These types of routes are supported:

```
src/routes/
  index.html.civet
  index.html.ts
  index.html.js

  foo.css.civet
  foo.css.ts
  foo.css.js

  foo.api.civet
  foo.api.ts
  foo.api.js

  foo.socket.civet
  foo.socket.ts
  foo.socket.js

  [foo].html.ts
  [foo].api.ts
  
  [...foo].html.ts
  [...foo].api.ts

  _unroutable.*
```

The markup DSL is almost identical to [PocketPress](https://github.com/errilaz/pocketpress) (minus the LiveScript) so documentation there can be referenced for now. The `example` project is the only documentation so far!
