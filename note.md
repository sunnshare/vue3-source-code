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

- 将 shared 文件与 reactivity 软连接 pnpm install @vue/shared
  @workspace --filter @vue/reactivity

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
