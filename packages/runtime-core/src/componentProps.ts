import { reactive } from '@vue/reactivity'
import { ComponentInternalInstance, Data } from './component'

export function initProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null
) {
  const props: Data = {}
  const attrs: Data = {}
  const options = Object.keys(instance.propsOptions)
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key]
      if (options.includes(key)) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  instance.props = reactive(props)
  instance.attrs = attrs
}
