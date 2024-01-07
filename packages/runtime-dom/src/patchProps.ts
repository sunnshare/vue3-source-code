import { RendererOptions } from '@vue/runtime-core'
import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/events'
import { patchAttr } from './modules/attrs'

type DOMRendererOptions = RendererOptions<Node, HTMLElement>

export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  preValue,
  nextValue
) => {
  if (key === 'class') {
    patchClass(el, nextValue) // 类名
  } else if (key === 'style') {
    patchStyle(el, preValue, nextValue) // 样式
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue) // 事件
  } else {
    patchAttr(el, key, nextValue) // setAttribute
  }
}
