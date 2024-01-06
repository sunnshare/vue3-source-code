import { Dep, createMap } from './dep'

type EffectScheduler = (...args: any[]) => any

// 记录正在活动中的 effect 数组
let effectStack: Array<ReactiveEffect> = [] // effect 栈型结构
export let activeEffect: ReactiveEffect | undefined // 指针 - 当前活动的effect
export class ReactiveEffect<T = any> {
  active = true // effect 是否失活
  deps: Array<Dep> = [] // effect 记录的 dep 数组
  _trackId = 0
  constructor(public fn: () => T, public scheduler?: EffectScheduler) {}

  run() {
    if (!this.active) {
      return this.fn() // effect 失活状态下直接返回函数
    }
    // 防止收集相同的 effect
    if (!effectStack.includes(this)) {
      try {
        effectStack.push((activeEffect = this)) // 收集当前的 effect，指针指向当前活动的 effect
        preCleanupEffect(this)
        return this.fn()
      } finally {
        // effect 执行完之后出栈，指针指向栈尾
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  // 移除 dep 上存储的 effect
  stop() {
    if (this.active) {
      preCleanupEffect(this)
      cleanupDepEffect(this)
      this.active = false
    }
  }
}

function cleanupDepEffect(effect: ReactiveEffect<any>) {
  const { deps } = effect
  for (let dep of deps) {
    dep.delete(effect)
    if (dep.size === 0) {
      dep.cleanUp()
    }
  }
}

function preCleanupEffect(effect: ReactiveEffect) {
  effect._trackId++
}

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<object, KeyToDepMap>() // effect 中追踪的 Dep

export function track(target: object, key: unknown) {
  // 属性不依赖 effect => 直接跳出
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map())) // {target:map{}}
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createMap(() => {}))) // {target:map{key:set[]}}
  }
  trackEffect(activeEffect, dep)
}

/** dep 记录这个 activeEffect, activeEffect 的 deps 记录 dep */
export function trackEffect(activeEffect: ReactiveEffect, dep: Dep) {
  let shouldTrack: boolean = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.set(activeEffect, activeEffect._trackId) // {target:Map{key:Map{activeEffect,1}}}
    activeEffect.deps.push(dep)
  }
}

export function trigger(target: object, key: unknown) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return // 修改的数据不依赖 effect
  let deps: (Dep | undefined)[] = []
  if (key !== void 0) {
    deps.push(depsMap.get(key))
  }
  for (const dep of deps) {
    if (dep) {
      triggerEffects(dep)
    }
  }
}

// 执行 dep 中每一个 effect
export function triggerEffects(dep: Dep) {
  for (const effect of dep.keys()) {
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler() // 说明是计算属性，执行定义的 scheduler 方法
      } else {
        effect.run()
      }
    }
  }
}
