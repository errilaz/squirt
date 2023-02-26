export default <SocketHandler>{
  open(ws) {
    console.log("server socket connected")
  },
  message(ws, message) {
    ws.sendText(message.toString().toUpperCase())
  },
}
