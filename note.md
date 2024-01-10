## monorepo 环境搭建

- 优点：各模块独立方便管理，结构清晰
- 缺点：仓库代码体积可能比较大

- workspaces 要配置 packages/\*，使用 yarn install 的时候，yarn 会将 package 的所有包设置软连接到 node_modules，这样就使用了各个模块的互相通信

- buildOptions 是我们自定义打包配置，name 为暴露全局变量的名称，formats 为打包类型

  - cjs => commonJS（module.exports）
  - esm-bundler => (import)
  - global => (iife 立即执行函数，暴露全局变量)

- private:true 防止 npm publish
- execa 开启进程 - 并行打包

- 将 shared 文件与 reactivity 软连接 pnpm install @vue/shared @workspace --filter @vue/reactivity

- npm run dev => node scripts/dev.js -s => rollup -cw --environment xxx => rollup.config.js

## 实现 reactive

- 防止嵌套代理：获取\_\_v_isReadonly 时，已被代理的对象会走 get 方法 ，get 方法直接返回 true
- 代理同一对象返回相同结果：使用一个 WeakMap 来构建对象与代理对象的映射，已被代理的对象直接从中取值，返回代理的结果
- weakMap key 必须是对象，如果 key 没有被引用就可以被自动回收

## 响应式原理实现 effect

- track 实现

  - 调用 effect 时，创建 ReactiveEffect 类，调用 run 方法
  - 收集 effect，指针指向当前 effect，再执行函数，effect 执行完毕之后，effect 出栈，改变指针指向
  - effect 内属性取值时，调用 track 方法，构建一个 {target:Map{key:Map{activeEffect:number}}} WeakMap 收集 activeEffect ReactiveEffect 收集 dep

- trigger 实现

  - 设置值的时候，判断该对象是否有关联 effect，再将取出来的 dep 数组依次执行 ReactiveEffect.run()

- effect 返回一个 runner 函数，将 ReactiveEffect 挂载到 runner 函数上

## 计算属性的实现 computed

- 初始化 computed

  - 取出用户传入的 getter 和 setter 方法， 返回 ComputedRefImpl 类的实例，创建 ReactiveEffect 的实例并用 effect 记录，传入一个更新的回调 scheduler

- set 设置值时直接调用 setter 方法，传入设置的参数

- get 取值时判断该属性依赖 effect，并收集当前依赖 effect，调用 effect.run() 方法，再收集计算属性 effect
- 获取执行的结果并用 \_value 缓存起来，设置 \_dirty = false

  - 下次取值时 \_dirty 为 false,直接拿到缓存的结果

- 计算属性依赖的值变化了(此时 中还有)，执行依赖值的 set 方法，触发 trigger，从 targetMap 中取出来对应的 dep 依次执行
- 如果该 effect 有 scheduler 方法说明是计算属性，则执行 scheduler() 方法，设置 \_dirty = true

## ref 实现

- 创建 RefImpl 的实例，记录原始的值，是对象用 reactive 包裹,否则返回本身

- 取值时触发 trackEffect，设置值时触发 triggerEffects

## render 函数实现

- createApp 方法实现

  - 调用 createRenderer 传入 dom 操作的 api 和更新 props 的方法，返回一个被各种方法包裹的 render 函数

- h 方法实现

  - 使用 typescript 函数重载适配不同的传入参数，最终调用了 createVNode 创造一个虚拟节点

- 调用 render 函数，有虚拟节点时，会调用 patch 更新节点，根据不同类型处理不同的节点

- 文本节点的处理方式：调用传入的 Dom api 创建文本节点，挂载到容器上

- 组件的处理方式

  - createComponentInstance 创建组件虚拟节点
  - setupComponent 给组件赋值，初始化 props,attrs,ctx,proxy,render,emit,expose 等
  - 创建组件 effect(使用 ReactiveEffect，传入 componentUpdateFn)，数据变化时触发 componentUpdateFn 函数，进行组件的更新 patch

- 元素节点处理方式

  - 是文本节点就创建文本元素
  - 是数组子元素，就递归使用 patch 方法进行处理
  - 是属性就调用传入的 patchProp 方法进行处理

- 最后将处理好的节点挂载到容器上
