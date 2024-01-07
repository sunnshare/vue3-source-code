import { ShapeFlags, isObject, isString } from '@vue/shared'
import { Component, Data } from './renderer'

export interface VNode {
  shapeFlag: number
}

export const createVNode = (
  type: Component,
  props: Data | null,
  children: unknown = null
): VNode => {
  const shapeFlag = isObject(type)
    ? ShapeFlags.COMPONENT
    : isString(type)
    ? ShapeFlags.ELEMENT
    : 0
  const vnode = {
    __v_isVNode: true,
    type,
    shapeFlag,
    props,
    children,
    key: props && props.key,
    component: null, // 如果是组件的虚拟节点要保存组件的实例
    el: null, // 虚拟节点对应的真实节点
  }
  if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}
