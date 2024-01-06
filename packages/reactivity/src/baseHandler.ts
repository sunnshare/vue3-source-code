import { ReactiveFlags } from './constants'
import { Target } from './reactive'
import { track, trigger } from './reactiveEffect'

// BaseReactiveHandler 实现 ProxyHandler<Target> 中的方法
class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor() {}

  get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    track(target, key)
    const res = Reflect.get(target, key, receiver) // target[key]
    return res
  }
}

// MutableReactiveHandler 继承自 BaseReactiveHandler
class MutableReactiveHandler extends BaseReactiveHandler {
  set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    const result = Reflect.set(target, key, value, receiver) // target[key] = value
    if (oldValue !== value) {
      // 值变化了就触发更新
      trigger(target, key)
    }
    return result
  }
}

export const mutableHandlers = new MutableReactiveHandler()
