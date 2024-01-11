import { ShapeFlags } from '@vue/shared'
import { CreateAppFunction, createAppAPI } from './apiCreateApp'
import {
  Text,
  VNode,
  VNodeArrayChildren,
  isSameVNodeType,
  normalizeVNode,
} from './vnode'
import {
  ComponentInternalInstance,
  Data,
  createComponentInstance,
  setupComponent,
} from './component'
import { ReactiveEffect } from '@vue/reactivity'

export interface RendererNode {
  [key: string]: any
}

export interface RendererElement extends RendererNode {}

export type RootRenderFunction<HostElement = RendererElement> = (
  vnode: VNode | null,
  container: HostElement
) => void

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void
  remove(el: HostNode): void
  createElement(type: string): HostElement
  createText(text: string): HostNode
  setElementText(node: HostElement, text: string): void
  setText(node: HostNode, text: string): void
  parentNode(node: HostNode): HostElement | null
  nextSibling(node: HostNode): HostNode | null
  querySelector(selector: string): HostElement | null
}

interface Renderer<HostElement = RendererElement> {
  render: RootRenderFunction<HostElement>
  createApp: CreateAppFunction<HostElement>
}

type MountComponentFn = (
  initialVNode: VNode,
  container: RendererElement
) => void

type PatchFn = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: RendererElement
) => void

type MountChildrenFn = (
  children: VNodeArrayChildren,
  container: RendererElement
) => void

type ProcessTextOrCommentFn = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement
) => void

type SetupRenderEffectFn = (
  instance: ComponentInternalInstance,
  initialVNode: VNode,
  container: RendererElement
) => void

type UnmountFn = (vnode: VNode) => void

export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(
  options: RendererOptions<Node, Element | ShadowRoot>
): Renderer<Element | ShadowRoot> {
  return baseCreateRenderer(options)
}

function baseCreateRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement>

function baseCreateRenderer(options: RendererOptions): any {
  // 将虚拟节点转换成真实节点渲染到容器中

  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options

  const setupRenderEffect: SetupRenderEffectFn = (
    instance,
    initialVNode,
    container
  ) => {
    // 创建渲染 effect
    const componentUpdateFn = () => {
      let { proxy } = instance
      if (!instance.isMounted) {
        // 组件初始化流程
        if (instance.render) {
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ))
          patch(null, subTree, container)
          initialVNode.el = subTree.el
          instance.isMounted = true
        }
      } else {
        // 组件更新流程
        const prevTree = instance.subTree
        const nextTree = instance.render!.call(proxy, proxy)
        patch(prevTree, nextTree, container)
      }
    }
    const effect = new ReactiveEffect(componentUpdateFn)
    // 默认调用 update 方法
    const update = () => {
      effect.run()
    }
    update()
  }

  const mountComponent: MountComponentFn = (initialVNode, container) => {
    // 根据组件的虚拟节点 创造一个真实节点
    // 给组件创造一个组件的实例
    const instance = createComponentInstance(initialVNode)

    // 给组件的实例进行赋值操作
    setupComponent(instance)

    // 调用 render 方法实现组件的渲染逻辑，数据变化要重新渲染
    setupRenderEffect(instance, initialVNode, container)
  }
  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement
  ) => {
    if (n1 == null) {
      mountComponent(n2, container)
    } else {
      // 组件的更新
    }
  }

  const mountChildren: MountChildrenFn = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null, child, container)
    }
  }

  const mountElement = (vnode: VNode, container: RendererElement) => {
    let { type, props, shapeFlag, children } = vnode

    let el = (vnode.el = hostCreateElement(type as string))

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children as string)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children as VNodeArrayChildren, el)
    }

    // 处理属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    hostInsert(el, container)
  }

  const patchProps = (el: RendererElement, oldProps: Data, newProps: Data) => {
    if (oldProps === newProps) return

    for (const key in newProps) {
      const prev = oldProps[key]
      const next = newProps[key]
      if (prev !== next) {
        hostPatchProp(el, key, prev, next)
      }
    }

    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps, newProps)
      }
    }
  }

  const patchElement = (n1: VNode, n2: VNode) => {
    let el = (n2.el = n1.el!) // 先比较元素，元素一致就复用

    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
  }

  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement
  ) => {
    if (n1 == null) {
      mountElement(n2, container) // 初始化
    } else {
      patchElement(n1, n2) // diff
    }
  }

  const processText: ProcessTextOrCommentFn = (n1, n2, container) => {
    if (n1 === null) {
      // 文本的初始化
      hostInsert(hostCreateText(n2.children as string), container)
    }
  }

  const unmount: UnmountFn = vnode => {
    hostRemove(vnode.el!)
  }

  const patch: PatchFn = (n1, n2, container) => {
    // 前后元素不一致 => 删除老的，换成新的元素
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    if (n1 == n2) return
    const { shapeFlag, type } = n2

    switch (type) {
      case Text:
        processText(n1, n2, container)
      default:
        if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container)
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container)
        }
    }
  }

  const render: RootRenderFunction = (vnode, container) => {
    if (vnode == null) {
    } else {
      patch(null, vnode, container)
    }
  }
  return {
    render,
    createApp: createAppAPI(render),
  }
}
