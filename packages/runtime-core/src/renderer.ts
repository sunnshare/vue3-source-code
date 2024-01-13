import { ShapeFlags, getSequence } from '@vue/shared'
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
  container: RendererElement,
  anchor?: RendererNode | null
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

type PatchChildrenFn = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement
) => void

type UnmountChildrenFn = (children: VNode[]) => void

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

  const mountElement = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
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

    hostInsert(el, container, anchor)
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

  const unmountChildren: UnmountChildrenFn = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  const patchKeyedChildren = (
    c1: VNode[],
    c2: VNode[],
    container: RendererElement
  ) => {
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    let i = 0

    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i < e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      i++
    }

    // 2. sync from end
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      e1--
      e2--
    }

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c d (a b)
    // i = 0, e1 = -1, e2 = 1
    if (i > e1 && i <= e2) {
      while (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        patch(null, c2[i], container, anchor)
        i++
      }
    }

    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a d (b c)
    // (b c)
    // i = 0, e1 = 1, e2 = -1
    else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    }

    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c e d] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      const s1 = i // prev starting index
      const s2 = i // next starting index

      // 5.1 build key:index map for newChildren
      const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2 loop through old children left to be patched and try to patch
      const toBePatched = e2 - s2 + 1

      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        }
        if (newIndex == undefined) {
          unmount(prevChild) // 新节点里面没有这个 key => 删除
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1 // 保证填入的值不为0
          patch(prevChild, c2[newIndex], container) // 比较 key 相同的两个节点
        }
      }

      // 5.3 move and mount
      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap) // 得出一个不用移动的索引序列

      let j = increasingNewIndexSequence.length - 1
      // looping backwards so that we can use last patched node as anchor
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, anchor) // 新增节点变成真实节点再插入
        } else {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el!, container, anchor)
          } else {
            j-- // 当前 i 不需要移动
          }
        }
      }
    }
  }

  const patchChildren: PatchChildrenFn = (n1, n2, container) => {
    const c1 = n1 && n1.children
    const c2 = n2.children
    const preShapeFlag = n1?.shapeFlag || 0
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1 as VNode[])
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2 as string)
      }
    } else {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyedChildren(c1 as VNode[], c2 as VNode[], container) // 比对两个数组的差异
        } else {
          unmountChildren(c1 as VNode[])
        }
      } else {
        if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2 as VNode[], container)
        }
      }
    }
  }

  const patchElement = (n1: VNode, n2: VNode) => {
    let el = (n2.el = n1.el!) // 先比较元素，元素一致就复用

    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)

    patchChildren(n1, n2, el) // 比较子元素
  }

  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
    if (n1 == null) {
      mountElement(n2, container, anchor) // 初始化
    } else {
      patchElement(n1, n2) // diff
    }
  }

  const processText: ProcessTextOrCommentFn = (n1, n2, container) => {
    if (n1 === null) {
      // 文本的初始化
      hostInsert((n2.el = hostCreateText(n2.children as string)), container)
    }
  }

  const unmount: UnmountFn = vnode => {
    hostRemove(vnode.el!)
  }

  const patch: PatchFn = (n1, n2, container, anchor = null) => {
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
          processElement(n1, n2, container, anchor)
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
