import { hasOwn } from '@vue/shared'
import { ComponentInternalInstance } from './component'

export type ComponentPublicInstance = {}

interface ComponentRenderContext {
  [key: string]: any
  _: ComponentInternalInstance
}

export const PublicInstanceProxyHandler: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    } else {
    }
  },
  set({ _: instance }, key, value) {
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      setupState[key] = value
    } else if (hasOwn(props, key)) {
      console.warn('Props are readonly')
      return false
    } else {
    }
    return true
  },
}
