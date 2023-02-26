export function get({}, { request }: Context) {
  return new Response("FOO " + request.url)
}
