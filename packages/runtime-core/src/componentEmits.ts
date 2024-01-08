export type EmitFn = (event: string, ...args: any[]) => void

export type ObjectEmitsOptions = Record<
  string,
  ((...args: any[]) => any) | null
>

export type UnwrapSlotsType<T> = {}

export type EmitsOptions = ObjectEmitsOptions | string[]
