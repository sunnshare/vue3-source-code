import {
  ComponentPublicInstance,
  PublicInstanceProxyHandler,
} from './ComponentPublicInstance'
import { EmitFn, EmitsOptions, UnwrapSlotsType } from './componentEmits'
import { InternalSlots, SlotsType } from './componentSlots'
import { VNode } from './vnode'
import { initProps } from './componentProps'
import { isFunction, isObject } from '@vue/shared'

export type Component = Record<any, any>

export type Data = Record<string, unknown>

type ConcreteComponent<Props = {}> = {
  setup: (props: Data, setupContext: SetupContext) => void
  props: Props
  render: () => void
}

type InternalRenderFunction = {
  [x: string]: any
}

export interface ComponentInternalInstance {
  /**
   * Vnode representing this component in its parent's vdom tree
   */
  vnode: VNode
  type: ConcreteComponent // 组件对象
  /**
   * Root vnode of this component's own vdom tree
   */
  subTree: VNode // 组件渲染的vnode
  ctx: Data // 组件上下文
  props: Data // 组件属性
  attrs: Data // 除了props之外的属性
  slots: InternalSlots // 组件的插槽
  setupState: Data // setup返回的状态
  propsOptions: Data // 属性选项
  proxy: ComponentPublicInstance | null // 实例的代理对象
  render: InternalRenderFunction | null // 组件的渲染函数
  emit: EmitFn // 事件触发
  expose: Record<string, any> | null // 暴露的方法
  isMounted: boolean // 是否挂载完成
}

type SetupContext<E = EmitsOptions, S extends SlotsType = {}> = E extends any
  ? {
      attrs: Data
      slots: UnwrapSlotsType<S>
      emit: EmitFn
      expose: (exposed?: Record<string, any>) => void
    }
  : never

export function createComponentInstance(vnode: VNode) {
  const type = vnode.type as ConcreteComponent
  const instance: ComponentInternalInstance = {
    vnode,
    type,
    subTree: null!,
    ctx: {},
    props: {},
    attrs: {},
    slots: {},
    setupState: {},
    propsOptions: type.props,
    proxy: null,
    render: null,
    emit: null!,
    expose: {},
    isMounted: false,
  }
  instance.ctx = { _: instance }
  return instance
}

export function setupComponent(instance: ComponentInternalInstance) {
  const { props, children } = instance.vnode
  // 组件的 props 初始化，attrs初始化
  initProps(instance, props)
  // 插槽的初始化
  // initSlots(instance, children)
  // 调用setup函数拿到返回值
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: ComponentInternalInstance) {
  // 核心：调用组件的setup方法
  const Component = instance.type
  const { setup } = Component
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandler) // proxy是代理的上下文

  if (setup) {
    const setupContext = createSetupContext(instance)
    let setupResult = setup(instance.props, setupContext)

    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else if (isObject(setupResult)) {
      instance.setupState = setupResult
    }
  }

  if (!instance.render) {
    instance.render = Component.render
  }
}

function createSetupContext(instance: ComponentInternalInstance): SetupContext {
  const expose: SetupContext['expose'] = expose =>
    (instance.expose = expose || {})
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose,
  }
}
