import { isObject } from '@vue/shared'
import { VNode, createVNode, isVNode } from './vnode'

export function h(
  type: any,
  props?: Record<any, any> | string | string[],
  children?: VNode | string | string[]
): VNode
export function h(type: any, children?: VNode): VNode
export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  let l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      return createVNode(type, propsOrChildren)
    } else {
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}
