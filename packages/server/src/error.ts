import "@squirt/markup"

export default function errorPage(request: Request, error: any) {
  const _title = production || !(error instanceof Error) ? "Server Error" : "Error: " + error.message
  return [
    doctype.html5,
    html(
      head(
        meta({ charset: "UTF-8" }),
        meta({ name: "darkreader-lock" }),
        meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
        title(_title),
        liveReload(development),
        style(
          rule("body",
            margin(0),
            fontFamily("sans-serif"),
            backgroundColor("#2a0000"),
            color("c0c0c0"),
            height("100vh"),
            display("flex"),
            alignItems("center"),
            justifyContent("center"),
          ),
          rule("main",
            backgroundColor("#a3a3a3"),
            width("600px"),
            padding("10px"),
            display("flex"),
            flexDirection("column"),
            boxShadow("0px 0px 10px #808080"),
          ),
          rule("h1",
            margin(0),
            textAlign("center"),
            color("#2a0000"),
            fontSize("40px"),
          ),
          rule("article",
            flex(1),
            display("flex"),
            flexDirection("column"),
            alignItems("center"),
            justifyContent("center"),
            rule("p",
              fontWeight("bold"),
              fontSize("24px"),
            ),
            rule("pre",
              backgroundColor("#7a7a7a"),
              padding("10px 20px"),
              fontSize("14px"),
            ),
          )
        )
      ),
      body(
        main(
          h1("Server Error"),
          production && article.production(
            p("Sorry, there was an unknown problem.")
          ),
          development && article.development(
            !(error instanceof Error) && p(
              error.toString(),
            ),
            error instanceof Error && [
              p(error.message),
              pre(Bun.inspect(error)),
            ],
            pre(
              Bun.inspect(request, null, 2),
            )
          )
        ),
      ),
    ),
  ]
}