export default ({ user }: { user: string }) => [
  doctype.html5,
  html(
    head(
      style(
        rule(".hello",
          fontWeight("bold"),
        )
      )
    ),
    body(
      div.hello(`User: ${user}`, color("blue")),
    )
  )
]
