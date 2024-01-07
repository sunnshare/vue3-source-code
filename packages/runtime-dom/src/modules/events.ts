type EventValue = Function | Function[]

interface Invoker extends EventListener {
  value: EventValue
}

const veiKey = Symbol('_vei')

export function patchEvent(
  el: Element & { [veiKey]?: Record<string, Invoker | undefined> },
  rawName: string,
  nextValue: EventValue | null
) {
  const invokers = el[veiKey] || (el[veiKey] = {}) // 在元素上增加一个自定义事件，用来绑定事件

  let exisitingInvoker = invokers[rawName] // 是否绑定过该事件
  if (exisitingInvoker && nextValue) {
    exisitingInvoker.value = nextValue // 换绑
  } else {
    const name = rawName.slice(2).toLowerCase() // 事件名
    if (nextValue) {
      // 有新值 => 需要进行绑定
      const invoker = (invokers[rawName] = createInvoker(nextValue)) // 返回一个引用
      el.addEventListener(name, invoker)
    } else if (exisitingInvoker) {
      // 无新值，还有事件 => 需要进行解绑
      el.removeEventListener(name, exisitingInvoker)
      invokers[rawName] = undefined
    }
  }
}

function createInvoker(initialValue: EventValue) {
  const invoker: Invoker = e => {
    if (Array.isArray(invoker.value)) {
      invoker.value.map(fn => fn(e))
    } else {
      invoker.value(e)
    }
  }
  invoker.value = initialValue
  return invoker
}
