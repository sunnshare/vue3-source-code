# is

类型谓词是一种在运行时帮助 TypeScript 编译器确定变量类型的语法。
使用谓词可以缩小变量类型的范围，从而避免手动类型转换。
谓词语法简单，只需要使用 is 关键字定义函数，指定目标类型即可。

如果谓词返回 true，TypeScript 编译器会将变量类型缩小为 TargetType。
如果返回 false，则变量仍然是原来的类型。

```ts
interface Animal {
  name: string
}
interface Cat extends Animal {
  purr: () => void
}
interface Dog extends Animal {
  bark: () => void
}
function isCat(animal: Animal): animal is Cat {
  return (animal as Cat).purr !== undefined
}
function makeSound(animal: Animal) {
  if (isCat(animal)) {
    animal.purr()
  } else {
    animal.bark()
  }
}
```
