export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function'
}
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isObject = (value: unknown): value is Record<any, any> => {
  return typeof value === 'object' && value !== null
}
