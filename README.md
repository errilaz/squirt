<img src="logo.png" width="200" height="200">

# Squirt

> HTML OVER THE WIRE ON THE BUN 

Squirt is a (🚧 pre-alpha 🚧) do-everything SSR/HOTW/AHAH server and framework built on [Bun](https://bun.sh).

- [Civet](https://civet.dev) support
- Next/Astro style filesystem routing
- Live reload
- Hyperscript-style HTML/CSS (all elements, properties, and at-rules are available on `globalThis` 😆)
- SOON: tiny client-side runtime for declarative interactivity

## Usage

### Install

```sh
bun add @squirt/markup @squirt/server
```

### Types

If you are using TypeScript and/or Civet, configure your `tsconfig.json`:

```json
{
  "compilerOptions": {
    ...
    "types": [
      "bun-types",
      "@squirt/markup",
      "@squirt/server"
    ]
  }
}
```

### Use

`bun run squirt`

## Routing

All routes are contained in the `src/routes` directory of your project.

Files with a leading dot `.` or underscore `_` are ignored.

Files named `index.*` matching route patterns will act as default routes for the directory.

All routes are modules. Named exports matching HTTP methods (in lowercase) will route those methods (except for `export del` which will match `DELETE` requests.)

Pages and stylesheets can `export default` to match `GET`, while API routes with `export default` will match **all** methods. All WebSocket routes should `export default`, as `GET` is the only valid method to upgrade the connection.

The export can be an object or a function. If it is a function, it will be called and passed a `Context` object, which contains the `request`, `route`, and `url` properties. If the route is dynamic, a second object will be passed containing the route parameters and values.

Use `src/public` for static files.

### Page Routes

- `*.html.civet`
- `*.html.ts`
- `*.html.js`

Page routes return HTML, typically created with the [`@squirt/markup`](#markup) builder DSL.

```ts
// index.html.ts
export default ({ url }) => [
  doctype.html5,
  html(
    head(
      style(
        rule("body",
          backgroundColor("black"),
          color("silver"),
        ),
        rule(".hello",
          fontWeight("bold")
        ),
      ),
    ),
    body(
      div.hello(
        `hello from ${url.pathname}!`,
        color("lime")
      ),
      liveReload(development),
    ),
  ),
]
```

### Stylesheet Routes

- `*.css.civet`
- `*.css.ts`
- `*.css.js`

Stylesheet routes return CSS, also typically created with the [`@squirt/markup`](#markup) builder DSL. Unlike other routes, the `.css` extension is matched in the URL.

```ts
// theme.css.ts
export default [
  rule("body",
    backgroundColor("black"),
    color("silver"),
  )
]
```

### API Routes

- `*.api.civet`
- `*.api.ts`
- `*.api.js`

API routes should return a Response object.

```ts
// echo.api.ts
export function get({ url }: Context) {
  return new Response(url.search.substring(1))
}
```

### WebSocket Routes

- `*.socket.civet`
- `*.socket.ts`
- `*.socket.js`

Socket routes should return an object with methods matching the [Bun WebSocket event handlers](https://bun.sh/docs/api/websockets):

```ts
// upper.socket.ts
export default <SocketHandler>{
  open(ws) {
    console.log("server socket connected")
  },
  message(ws, message) {
    ws.sendText(message.toString().toUpperCase())
  },
}
```

### Dynamic Routes

Routes can be parameterized with square-braced file or directory names (such as `[foo].api.ts` or `[user]/index.html.ts`) 

### Wildcard Routes

Rest-style dynamic routes work, as well: `[...myParam].html.ts`

## Markup

All HTML element and CSS property/at-rule names are defined globally as functions which create virtual DOM nodes. At render time, these are converted to HTML and CSS.

```ts
div(
  span("Password: "),
  input({ type: "password" })
)
```

Civet example:

```civet
div [
  span "Password: "
  input { type: "password" }
]
```

Strings, numbers, arrays, etc. are supported as children. `null`, `undefined`, and `false` will render as empty. Anything unrecognized will be converted with `.toString()`.

The `raw` function will skip HTML escaping for its contents.

The `var` element is named `_var` due to conflict with the JS keyword.

### Class Syntax Sugar

You can apply classes directly to element functions:

```ts
div(
  div.redBold("this is bold and red!"),
  div.redBold.alsoItalic("this has two classes!")
)
```

Class names are automatically converted to `kebab-case`.

### Styles

Style tags can use the `rule` function to define CSS rules. Custom properties may use the `prop` function:

```ts
style(
  rule(".red-bold",
    color("red"),
    fontWeight("bold"),
    prop("-some-nonstandard", "value"),
  )
)
```

All standard CSS properties are included. The `continue` property is called `_continue` due to conflict with the JS keyword. Known vendor-specific properties are also available, without the leading `-`.

### Inline Styles

You can apply CSS properties directly on elements:

```ts
div(
  color("red"),
  fontWeight("bold"),
  "this is bold and red!",
)
```

### Nested Rules

Rules may be nested:

```ts
rule(".danger",
  color("red"),
  rule(".icon",
    float("right"),
  ),
)
```

Child selectors can be combined with the parent selector, similar to Sass and Less.js. This results in a second rule with the selector `.danger.large`:

```ts
rule(".danger",
  color("red"),
  rule("&.large",
    fontSize("40px")
  ),
)
```

Nested selectors with pseudo-classes do the same:

```ts
rule("a",
  color("red"),
  rule(":hover",
    textDecoration("underline"),
  ),
)
```

Squirt detects multiple selectors in a rule and will generate the necessary CSS:

```ts
rule("input, textarea",
  border("solid 1px gray"),
  rule(":hover, :focus",
    borderColor("black"),
  ),
)
```

### At-rules

Media queries and other [at-rules](https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule) are supported
with the `$` prefix: 

```ts
$media("(prefers-color-scheme: dark)",
  rule(":root",
    prop("--fg", "white"),
    prop("--bg", "black"),
  ),
)
```

```ts
$layer(
  rule("p",
    color("red"),
  )
)
```

### Layouts & Partials

Layouts and partials can be defined simply as functions, imported from a non-routable file.

## Live Reload

The `liveReload()` function can be called, which will embed a `<script>` tag which reloads the page when the source changes. Currently this reloads any page when any source changes. You can pass an optional boolean to enable/disable this setting.

## Globals

The global `root` refers to the root directory of the site.

`production` and `development` are booleans.

Site-defined globals can be the default export of one of the following paths:

- `src/common/globals.civet`
- `src/common/globals.ts`
- `src/common/globals.js`

These will also be reloaded when changed.
