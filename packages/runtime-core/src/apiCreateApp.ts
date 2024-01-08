import { Component, Data } from './component'
import { RootRenderFunction } from './renderer'
import { createVNode } from './vnode'

interface App<HostElement = any> {
  mount(rootContainer: HostElement | string): any
}

export type CreateAppFunction<HostElement> = (
  rootComponent: Component,
  rootProps: Data | null
) => App<HostElement>

export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>
): CreateAppFunction<HostElement> {
  return (rootComponent, rootProps) => {
    let isMounted = false
    const app = {
      use() {},
      mixin() {},
      component() {},
      directive() {},
      mount(rootContainer: any) {
        // 创造组件虚拟节点
        const vnode = createVNode(rootComponent, rootProps)

        if (!isMounted) {
          isMounted = true
        }
        render(vnode, rootContainer)
      },
      unmount() {},
      privide() {},
      runWithContext() {},
    }
    return app
  }
}
