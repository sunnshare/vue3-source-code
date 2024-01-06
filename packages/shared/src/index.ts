export const isObject = (value: unknown): value is Record<any, any> => {
  return typeof value === 'object' && value !== null
}

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function'
}
