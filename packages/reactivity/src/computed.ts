import { isFunction } from '@vue/shared'
import { Dep, createMap } from './dep'
import {
  ReactiveEffect,
  activeEffect,
  trackEffect,
  triggerEffects,
} from './reactiveEffect'
import { ReactiveFlags } from './constants'

type ComputedGetter<T> = (oldValue?: T) => T
type ComputedSetter<T> = (newValue: T) => void

interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

class ComputedRefImpl<T> {
  public dep?: Dep = undefined // 当前计算属性依赖的 effect

  private _value!: T // 缓存的计算属性值

  public readonly [ReactiveFlags.IS_READONLY]: boolean = true
  public readonly effect: ReactiveEffect // 计算属性 effect
  public _dirty: boolean = true // 脏值标记

  constructor(getter: ComputedGetter<T>, public setter: ComputedSetter<T>) {
    // 将计算属性包装成一个 effect，多传入一个回调用于更新计算属性依赖的 effect
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        if (this.dep) {
          triggerEffects(this.dep) // 当前计算属性有依赖的 effect 就去触发更新
        }
      }
    })
  }
  get value() {
    // 判断当前计算属性是否依赖 effect，有依赖就去关联依赖
    if (activeEffect) {
      trackEffect(activeEffect, this.dep || (this.dep = createMap(() => {})))
    }
    // 取过一次就将结果缓存起来
    if (this._dirty === true) {
      this._value = this.effect.run() // 缓存 effect 执行的结果
      this._dirty = false
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue) // 设置值时直接调用传入的setter(设置的参数)方法
  }
}

// 支持两种传入形式
export function computed<T>(getter: ComputedGetter<T>): any
export function computed<T>(options: WritableComputedOptions<T>): any
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>
  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter, setter)
}
