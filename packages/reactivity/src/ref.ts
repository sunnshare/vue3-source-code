import { Dep, createMap } from './dep'
import { toRaw, toReactive } from './reactive'
import { activeEffect, trackEffect, triggerEffects } from './reactiveEffect'

class RefImpl<T> {
  private _value: T
  private _rawValue: T
  public dep?: Dep = undefined
  public readonly __v_isRef = true
  constructor(value: T) {
    this._rawValue = toRaw(value)
    this._value = toReactive(value)
  }

  get value() {
    if (activeEffect) {
      trackEffect(
        activeEffect,
        this.dep || (this.dep = createMap(() => (this.dep = undefined)))
      )
    }
    return this._value
  }

  set value(newValue) {
    newValue = toRaw(newValue)
    if (newValue !== this._rawValue) {
      this._rawValue = newValue
      this._value = toReactive(newValue)
      if (this.dep) {
        triggerEffects(this.dep)
      }
    }
  }
}

function createRef(rawValue: unknown) {
  return new RefImpl(rawValue)
}

export function ref(value: unknown) {
  return createRef(value)
}

// export function shallowRef(value) {}
