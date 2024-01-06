import { isObject } from '@vue/shared'
import { ReactiveFlags } from './constants'
import { mutableHandlers } from './baseHandler'
export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

const reactiveMap = new WeakMap()

function createReactiveObject(target: Target) {
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target // 代理过直接返回代理的结果
  }

  if (!isObject(target)) {
    return target
  }

  const exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) return exisitingProxy // 映射表已存在该 Proxy，直接返回 Proxy

  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy) // 将原对象和代理对象做一个映射表
  return proxy
}

export function reactive(target: Target) {
  return createReactiveObject(target)
}

export const toReactive = <T>(value: T): T =>
  isObject(value) ? reactive(value) : value

export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}
// export function readonly() {}
// export function shallowReactive() {}
// export function shallowReadonly() {}
