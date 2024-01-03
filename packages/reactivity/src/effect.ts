let effectStack: Array<ReactiveEffect> = [] // effect 栈型结构
let activeEffect: ReactiveEffect | undefined // 指针 - 当前活动的effect
class ReactiveEffect<T = any> {
  active: Boolean = true
  deps: Array<Dep> = []
  constructor(public fn: () => T) {}
  run() {
    if (!this.active) {
      return this.fn()
    }
    // 防止收集相同的 effect
    if (!effectStack.includes(this)) {
      try {
        effectStack.push((activeEffect = this)) // 收集当前的 effect，指针指向当前活动的 effect
        return this.fn()
      } finally {
        effectStack.pop() // effect 执行完之后出栈，指针指向栈尾
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
}

// 当前 activeEffect 有值说明在 effect 中
export function isTracking() {
  return activeEffect !== undefined
}

type Dep = Set<ReactiveEffect>

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<object, KeyToDepMap>()

export function track(target: object, key: unknown) {
  // 属性不依赖 effect => 直接跳出
  if (!isTracking()) return
  activeEffect = activeEffect as ReactiveEffect
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map())) // {target:map{}}
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set())) // {target:map{key:set[]}}
  }
  let shouldTrack: boolean = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect) // {target:map{key:set[activeEffect]}}
    activeEffect.deps.push(dep)
  }
  console.log(targetMap)
}

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run() // 会默认让fn执行一次
}
