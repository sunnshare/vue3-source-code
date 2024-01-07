# proxy

Proxy 对象用于创建一个对象的代理，从而实现基本操作的拦截和自定义（如属性查找、赋值、枚举、函数调用等）。

## 语法

```js
const p = new Proxy(target, handler)
```

## 参数

- target
  要使用 Proxy 包装的目标对象（可以是任何类型的对象，包括原生数组，函数，甚至另一个代理）。

- handler
  一个通常以函数作为属性的对象，各属性中的函数分别定义了在执行各种操作时代理 p 的行为。

### handler

1. handler.get(target, property, receiver) 方法用于拦截对象的读取属性操作。

```js
var p = new Proxy(
  {},
  {
    get: function (target, prop, receiver) {
      console.log('called: ' + prop)
      return 10
    },
  }
)
console.log(p.a) // "called: a"; ouptut 10
```

2. handler.set(target, property, value, receiver) 方法是设置属性值操作的捕获器。

```js
var p = new Proxy(
  {},
  {
    set: function (target, prop, value, receiver) {
      target[prop] = value
      console.log('property set: ' + prop + ' = ' + value)
      return true
    },
  }
)

console.log('a' in p) // false

p.a = 10 // "property set: a = 10"
console.log('a' in p) // true
console.log(p.a) // 10
```

3. others 共 13 种

- handler.getPrototypeOf() Object.getPrototypeOf 方法的捕捉器。

- handler.setPrototypeOf() Object.setPrototypeOf 方法的捕捉器。

- handler.isExtensible() Object.isExtensible 方法的捕捉器。

- handler.preventExtensions() Object.preventExtensions 方法的捕捉器。

- handler.getOwnPropertyDescriptor() Object.getOwnPropertyDescriptor 方法的捕捉器。

- handler.defineProperty() Object.defineProperty 方法的捕捉器。

- handler.has() in 操作符的捕捉器。

- handler.deleteProperty() delete 操作符的捕捉器。

- handler.ownKeys() Object.getOwnPropertyNames 方法和 Object.getOwnPropertySymbols 方法的捕捉器。

- handler.apply() 函数调用操作的捕捉器。

- handler.construct() new 操作符的捕捉器。
