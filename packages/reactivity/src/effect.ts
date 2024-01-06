import { ReactiveEffect } from './reactiveEffect'

interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run() // 会默认让fn执行一次

  let runner = _effect.run.bind(_effect) as ReactiveEffectRunner

  runner.effect = _effect
  return runner
}
