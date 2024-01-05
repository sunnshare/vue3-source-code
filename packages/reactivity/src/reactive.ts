import { isObject } from '@vue/shared'
import { ReactiveFlags } from './constants'
import { track, trigger } from './effect'

interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

const mutableHandlers: ProxyHandler<Record<any, any>> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    track(target, key)
    const res = Reflect.get(target, key, recevier) // target[key]
    return res
  },
  set(target: object, key: string | symbol, value, recevier) {
    let oldValue = (target as any)[key]

    const res = Reflect.set(target, key, value, recevier) // target[key] = value

    if (oldValue !== value) {
      // 值变化了就触发更新
      trigger(target, key)
    }
    return res
  },
}

const reactiveMap = new WeakMap()

function createReactiveObject(target: Target) {
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  if (!isObject(target)) {
    return target
  }

  const exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) return exisitingProxy

  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy) // 将原对象和代理对象做一个映射表
  return proxy
}

export function reactive(target: Target) {
  return createReactiveObject(target)
}

// export function readonly() {}
// export function shallowReactive() {}
// export function shallowReadonly() {}
