export default ({ request }: Context) => [
  doctype.html5,
  html(
    head(
      meta({ charset: "UTF-8" }),
      meta({ name: "darkreader-lock" }),
      meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      title("Hello Squirt"),
      liveReload(development),
      style(
        rule(body,
          backgroundColor.black,
          color.silver,
        ),
        rule.world(
          color.lime,
        )
      ),
    ),
    body(
      h1(siteName),
      div(
        span("hello "),
        span.world("world!"),
      ),
      div(`you are visiting ${request.url}`),
      input({ type: "password" }),
    ),
  )
]