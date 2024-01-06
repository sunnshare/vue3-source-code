import { Dep, createMap } from './dep'

let effectStack: Array<ReactiveEffect> = [] // effect 栈型结构
let activeEffect: ReactiveEffect | undefined // 指针 - 当前活动的effect

export class ReactiveEffect<T = any> {
  active = true
  deps: Array<Dep> = []
  _trackId = 0
  constructor(public fn: () => T) {}

  run() {
    if (!this.active) {
      return this.fn()
    }
    // 防止收集相同的 effect
    if (!effectStack.includes(this)) {
      try {
        effectStack.push((activeEffect = this)) // 收集当前的 effect，指针指向当前活动的 effect
        preCleanupEffect(this)
        return this.fn()
      } finally {
        effectStack.pop() // effect 执行完之后出栈，指针指向栈尾
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

const targetMap = new WeakMap<object, KeyToDepMap>()
type KeyToDepMap = Map<any, Dep>

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
  let effects: ReactiveEffect<any>[] = []
  for (const dep of deps) {
    effects.push(...(dep as Dep).keys())
  }
  for (const effect of effects) {
    if (effect !== activeEffect) {
      effect.run()
    }
  }
}
