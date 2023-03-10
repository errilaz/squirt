<img src="logo.png" width="200" height="200">

# Squirt

<a href="https://www.npmjs.com/package/@squirt/server"><img src="https://img.shields.io/npm/v/@squirt/server?label=%40squirt%2Fserver&style=flat-square"></a>
<a href="https://www.npmjs.com/package/@squirt/markup"><img src="https://img.shields.io/npm/v/@squirt/markup?label=%40squirt%2Fmarkup&style=flat-square"></a>

> HTML Over The Wire On The Bun

Squirt is a (🚧 pre-alpha 🚧) do-everything SSR/HOTW/AHAH server and framework built on [Bun](https://bun.sh).

- [Civet](https://civet.dev) support
- Next/Astro-style filesystem routing
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

- `*.html.ts`
- `*.html.civet`
- `*.html.js`

Page routes return HTML, typically created with the [`@squirt/markup`](#markup) builder DSL. Simple example:

```ts
// index.html.ts
export default ({ url }) => [
  doctype.html5,
  html(
    head(
      title("hello world!"),
      liveReload(development),
    ),
    body(
      div.hello(
        `hello from ${url.pathname}!`,
        color("lime")
      ),
    ),
  ),
]
```

Page routes can also directly return a `Response` to override rendering.

### Stylesheet Routes

- `*.css.ts`
- `*.css.civet`
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

- `*.api.ts`
- `*.api.civet`
- `*.api.js`

API routes should return a Response object.

```ts
// echo.api.ts
export function get({ url }: Context) {
  return new Response(url.search.substring(1))
}
```

### WebSocket Routes

- `*.socket.ts`
- `*.socket.civet`
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

## Live Reload

The `liveReload()` function can be included in a page - this will embed a `<script>` tag which reloads the page when the source changes. Currently this reloads any page when any source changes. You can pass an optional boolean to enable/disable this setting.

## Globals

- `root`: absolute path to the project's root directory.
- `production`: true in production
- `development`: true in development
- `redirect(location: string, temporary: boolean = false)`: returns a 302 redirect `Response`, or 307 if `temporary` is `true`.

### Extending Globals

Squirt is crazy with globals, so it provides the ability to define your own. Project-specific globals can be defined in files matching these patterns:

- `*.global.ts`
- `*.global.civet`
- `*.global.js`

These will work with Live Reload. You can use the default export with an object containing keys, or use named exports. Example:

```ts
// db.global.ts
import _db from "./db"

declare global {
  const db: typeof _db
}

export default {
  db: _db
}
```

## Extending Context

Files matching these patterns are `Context` extensions:

- `*.context.ts`
- `*.context.civet`
- `*.context.js`

These are run on each request to augment the `Context` object with your own values. They should export a default function which returns an object containing additional keys/values. Example:

```ts
// session.global.ts
declare global {
  // Augmenting the global Context with a possible session field
  interface Context {
    session?: MySessionType
  }

  // Creating a Context type for when session is known to be present
  interface SessionContext extends Context {
    session: MySessionType
  }
}

export default ({ request }: Context) => {
  const session = getMySession(request)
  return { session }
}
```

Here is an example adding a utility for marking hyperlinks matching the current page with a CSS class:

```ts
// utility.context.ts
declare global {
  interface Context {
    href(href: string): any
  }
}

export default ({ url }: Context) => ({
  href(href: string) {
    return [{ href }, url.pathname === href && { class: "current" }]
  }
})
```

Which can be then used in `a` elements:

```ts
a("Profile", context.href("/profile")),
a("Inbox", context.href("/inbox")),
```


## Layouts & Partials

Layouts and partial views can be simply be defined as functions and imported.

```ts
// site.layout.ts
export default (_title: any, _content: any) => [
  doctype.html5,
  html(
    head(
      meta({ charset: "UTF-8" }),
      meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      title(_title),
      liveReload(development),
    ),
    body(_content),
  )
]
```

## Markup

All HTML element and CSS property/at-rule names are defined globally as functions which create virtual DOM nodes. At render time, these are converted to HTML and CSS.

TypeScript/JavaScript example:

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

Strings, numbers, arrays, etc. are supported as children. `null`, `undefined`, and `false` will render as empty. Anything unrecognized will be converted with `.toString()`. Attributes are defined with plain `{}` objects. Multiple objects can be defined for conveninent composition, and these can appear *after* child elements, text nodes, etc.

```ts
a.someClass("My Link", { href: "/my_link" }, { class: "another-class" })
```

The `raw` function will skip HTML escaping for its contents:

```ts
raw("<span>hello!</span>")
```

The `var` element is named `_var` due to conflict with the JS keyword.

### Element Class Shorthand

You can apply classes directly to element functions:

```ts
div(
  div.redBold("this is bold and red!"),
  div.redBold.alsoItalic("this has two classes!")
)
```

Class names are automatically converted to `kebab-case`.

### Styles

All standard and known vendor-specific CSS properties are global functions:

```ts
color("#ff0000"),
border("solid 1px red"),
webkitBorderImageWidth("4px"),
_continue("auto"),  // conflicts with JS keywords are prefixed with underscore
```

Standard values are also available as properties on these functions:

```ts
color.red,
borderStyle.dashed,
_continue.auto,
```

#### Rules

The `rule` function can be used within style elements to define CSS rules. Custom properties may use the `prop` function.

```ts
style(
  rule(".red-bold",
    color.red,
    fontWeight.bold,
    prop("-some-nonstandard", "value"),
  )
)
```

#### Rule Shorthand Selectors

Element functions may be used as selectors:

```ts
rule(textarea,
  borderColor.black,
)
```

Class names may be used as selectors (these are converted to `kebab-case`):

```ts
rule.container(
  width("1200px"),
)
```

### Inline Styles

You can add CSS properties directly to elements:

```ts
div(
  color.red,
  fontWeight.bold,
  "this is bold and red!",
)
```

### Nested Rules

Rules may be nested:

```ts
rule(".danger",
  color.red,
  rule(".icon",
    float.right,
  ),
)
```

Child selectors can be combined with the parent selector, similar to Sass and Less.js. This example produces two rules, the second with the selector `.danger.large`:

```ts
rule(".danger",
  color.red,
  rule("&.large",
    fontSize("40px")
  ),
)
```

Nested selectors with pseudo-classes do the same:

```ts
rule(a,
  color.red,
  textDecorationLine.none,
  rule(":hover",
    textDecorationLine.underline,
  ),
)
```

Squirt detects multiple selectors in a rule and will generate the necessary CSS:

```ts
rule("input, textarea",
  border("solid 1px gray"),
  rule(":hover, :focus",
    borderColor.black,
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
    color.red,
  )
)
```
