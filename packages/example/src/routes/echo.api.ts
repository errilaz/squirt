export function get({ request }: Context) {
  return new Response("ECHO " + request.url)
}
