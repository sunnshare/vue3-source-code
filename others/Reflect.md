# Reflext

Reflect 对象与 Proxy 对象一样，也是 ES6 为了操作对象而提供的新 API

### Reflect.get(target, name, receiver)

Reflect.get 方法查找并返回 target 对象的 name 属性，如果没有该属性，则返回 undefined。

```js
var myObject = {
  foo: 1,
  bar: 2,
  get baz() {
    return this.foo + this.bar
  },
}

var myReceiverObject = {
  foo: 4,
  bar: 4,
}

Reflect.get(myObject, 'baz', myReceiverObject) // 8
```

### Reflect.set(target, name, value, receiver)

Reflect.set 方法设置 target 对象的 name 属性等于 value。

```js
var myObject = {
  foo: 1,
  set bar(value) {
    return (this.foo = value)
  },
}

myObject.foo // 1

Reflect.set(myObject, 'foo', 2)
myObject.foo // 2

Reflect.set(myObject, 'bar', 3)
myObject.foo // 3
```

### others

- Reflect.apply(target, thisArg, args)
- Reflect.construct(target, args)
- Reflect.get(target, name, receiver)
- Reflect.set(target, name, value, receiver)
- Reflect.defineProperty(target, name, desc)
- Reflect.deleteProperty(target, name)
- Reflect.has(target, name)
- Reflect.ownKeys(target)
- Reflect.isExtensible(target)
- Reflect.preventExtensions(target)
- Reflect.getOwnPropertyDescriptor(target, name)
- Reflect.getPrototypeOf(target)
- Reflect.setPrototypeOf(target, prototype)
