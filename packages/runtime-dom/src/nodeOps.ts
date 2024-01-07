import type { RendererOptions } from '@vue/runtime-core'

// Omit 从类型中去除 'patchProp'
export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor) // anchor 不存在时相当于 parent.appendChild(child)
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement: tag => document.createElement(tag),
  createText: text => document.createTextNode(text),
  setElementText: (node, text) => (node.textContent = text),
  setText: (node, text) => (node.nodeValue = text),
  parentNode: node => node.parentNode as Element | null,
  nextSibling: node => node.nextSibling,
  querySelector: selector => document.querySelector(selector),
}
