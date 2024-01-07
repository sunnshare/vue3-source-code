import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { VNode } from './vnode'

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

export type Component = Record<any, any>

export type CreateAppFunction<HostElement> = (
  rootComponent: Component,
  rootProps: Data | null
) => App<HostElement>

interface App<HostElement = any> {
  mount(rootContainer: HostElement | string): any
}

export type Data = Record<string, unknown>

interface Renderer<HostElement = RendererElement> {
  render: RootRenderFunction<HostElement>
  createApp: CreateAppFunction<HostElement>
}

type MountComponentFn = (
  initialVNode: VNode,
  container: RendererElement
) => void

export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(
  options: RendererOptions<Node, Element | ShadowRoot>
): Renderer<Element | ShadowRoot> {
  return baseCreateRenderer(options)
}

type PatchFn = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: RendererElement
) => void

function baseCreateRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement>

function baseCreateRenderer(options: RendererOptions): any {
  // 将虚拟节点转换成真实节点渲染到容器中

  const mountComponent: MountComponentFn = (initialVNode, container) => {
    // 根据组件的虚拟节点 创造一个真实节点
  }
  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement
  ) => {
    debugger
    if (n1 == null) {
      mountComponent(n2, container)
    } else {
      // 组件的更新
    }
  }

  const patch: PatchFn = (n1, n2, container) => {
    if (n1 == n2) return
    const { shapeFlag } = n2
    if (shapeFlag & ShapeFlags.COMPONENT) {
      processComponent(n1, n2, container)
    }
  }

  const render: RootRenderFunction = (vnode, container) => {
    if (vnode == null) {
    } else {
      patch(null, vnode!, container)
    }
  }
  return {
    render,
    createApp: createAppAPI(render),
  }
}
