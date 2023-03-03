(function () {
  const url = new URL(document.location.toString())
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:"
  url.pathname = "_live_reload_"

  let timeout = 250

  connect()

  function connect() {
    const ws = new WebSocket(url)

    ws.addEventListener("open", () => {
      console.log("🔥 Live reload connected!")
      timeout = 250
    })

    ws.addEventListener("message", event => {
      if (event.data === "reload") {
        document.location.reload()
      }
    })

    ws.addEventListener("error", () => {
      ws.close()
    })

    ws.addEventListener("close", ({ reason }) => {
      console.warn("Live reload disconnected, reconnecting in " + Math.min(2000, timeout) + "ms.", reason)
      setTimeout(connect, Math.min(2000, timeout += timeout))
    })
  }
})()