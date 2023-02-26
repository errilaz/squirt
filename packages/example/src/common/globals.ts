/**
 * Waiting on possible indented application in civet, these
 * helpers make deeply nested markup a little easier on
 * the eyes (https://github.com/DanielXMoore/Civet/pull/398)
 */

declare global {
  const $: null
  const list: (...args: any[]) => any[]
}

export default {
  $: null,
  list: (...args: any[]) => [...args]
}
