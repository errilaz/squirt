export function get({ baz }: { baz: string }) {
  return new Response("baz is: " + baz)
}
