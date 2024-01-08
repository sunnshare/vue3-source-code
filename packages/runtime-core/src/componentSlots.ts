import { IfAny } from '@vue/shared'
import { VNode } from './vnode'

export type Slot<T extends any = any> = (
  ...args: IfAny<T, any[], [T] | (T extends undefined ? [] : never)>
) => VNode[]

declare const SlotSymbol: unique symbol
export type SlotsType<T extends Record<string, any> = Record<string, any>> = {
  [SlotSymbol]?: T
}

export type InternalSlots = {
  [name: string]: Slot | undefined
}
