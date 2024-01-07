# Omit<Type, Keys>

Constructs a type by picking all properties from Type and then removing Keys (string literal or union of string literals). The opposite of Pick.

```ts
interface Todo {
  title: string
  description: string
  completed: boolean
  createdAt: number
}

type TodoInfo = Omit<Todo, 'completed' | 'createdAt'>

const todoInfo: TodoInfo = {
  title: 'Pick up kids',
  description: 'Kindergarten closes at 5pm',
}
```
