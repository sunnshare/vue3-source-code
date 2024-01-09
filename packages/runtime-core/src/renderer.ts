import { ShapeFlags } from '@vue/shared'
import { CreateAppFunction, createAppAPI } from './apiCreateApp'
import { VNode } from './vnode'
import {
  ComponentInternalInstance,
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

export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(
  options: RendererOptions<Node, Element | ShadowRoot>
): Renderer<Element | ShadowRoot> {
  return baseCreateRenderer(options)
}

type SetupRenderEffectFn = (
  instance: ComponentInternalInstance,
  initialVNode: VNode,
  container: RendererElement
) => void

function baseCreateRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement>

function baseCreateRenderer(options: RendererOptions): any {
  // 将虚拟节点转换成真实节点渲染到容器中

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
        }
        instance.isMounted = true
      } else {
        // 组件更新流程
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
