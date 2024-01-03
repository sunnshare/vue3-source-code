# Record<keys, Type>

用于构造一个对象类型，它所有的 key(键)都是 Keys 类型，它所有的 value(值)都是 Type 类型。这个工具类型可以被用于映射一个类型的属性到另一个类型。

```
interface CatInfo {
  age: number;
  breed: string;
}

type CatName = "miffy" | "boris" | "mordred";

const cats: Record<CatName, CatInfo> = {
  miffy: { age: 10, breed: "Persian" },
  boris: { age: 5, breed: "Maine Coon" },
  mordred: { age: 16, breed: "British Shorthair" },
};
```
