import { ReactiveEffect } from './reactiveEffect'

export type Dep = Map<ReactiveEffect<any>, number> & {
  cleanUp: () => void
}

export function createMap(cleanUp: () => void): Dep {
  const dep = new Map() as Dep
  dep.cleanUp = cleanUp
  return dep
}
