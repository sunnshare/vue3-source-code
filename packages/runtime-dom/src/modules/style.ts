import { isObject, isString } from '@vue/shared'

type Style = string | Record<string, string | string[]> | null

export function patchStyle(el: HTMLElement, prev: Style, next: Style) {
  const style: any = el.style
  // 新样式加到元素上
  if (next && !isString(next)) {
    for (let key in next) {
      style[key] = next[key]
    }
  }
  if (prev && !isString(prev)) {
    for (let key in prev) {
      if (isObject(next)) {
        if (next[key] == null) {
          style[key] = null
        }
      }
    }
  }
}
