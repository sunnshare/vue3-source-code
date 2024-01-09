export * from '@vue/reactivity'
export * from '@vue/runtime-core'
import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProps'
import { CreateAppFunction } from 'packages/runtime-core/src/apiCreateApp'

const renderOptions = Object.assign(nodeOps, { patchProp })

export const createApp: CreateAppFunction<Element> = (
  component,
  rootProps = null
) => {
  const { createApp } = createRenderer(renderOptions)
  let app = createApp(component, rootProps)
  let { mount } = app
  app.mount = function (rootContainer: string) {
    const container = nodeOps.querySelector(rootContainer)
    if (container) {
      container.innerHTML = ''
      mount(container)
    }
  }
  return app
}
