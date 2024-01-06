type ComputedGetter<T> = (oldValue?: T) => T
type ComputedSetter<T> = (newValue: T) => void

interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  console.log(getterOrOptions)
}
