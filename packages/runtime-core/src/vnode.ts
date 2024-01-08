import { ShapeFlags, isObject, isString } from '@vue/shared'
import { Component, ComponentInternalInstance, Data } from './component'
import { RendererNode } from './renderer'

type VnodeTypes = string | VNode | Component

type VNodeProps = {
  key?: string | number | symbol
}
type ExtraProps = { [key: string]: any }

type VNodeChildAtom =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void

type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>

type VNodeNormalizedChildren = string | VNodeArrayChildren | null

export interface VNode<HostNode = RendererNode> {
  __v_isVNode: true
  type: VnodeTypes
  props: (VNodeProps & ExtraProps) | null
  key: string | number | symbol | null
  children: VNodeNormalizedChildren
  component: ComponentInternalInstance | null
  el: HostNode | null
  shapeFlag: number
}

const normalizeKey = ({ key }: VNodeProps): VNode['key'] =>
  key != null ? key : null

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
    props,
    key: props && normalizeKey(props),
    children,
    component: null, // 如果是组件的虚拟节点要保存组件的实例
    el: null, // 虚拟节点对应的真实节点
    shapeFlag,
  } as VNode

  if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}
