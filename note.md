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

- 防止嵌套代理：\_\_v_isReadonly 用来标识已被代理，get 方法时直接返回 true
- 代理同一对象返回相同结果：使用一个 WeakMap 来构建对象与代理对象的映射，已被代理的对象直接返回代理的结果
- weakMap key 必须是对象，如果 key 没有被引用就可以被自动回收

## 响应式原理实现 effect

- track 实现

  - 调用 effect 时，创建 ReactiveEffect 类，调用 run 方法
  - 收集 effect，指针指向当前 effect，再执行函数，effect 执行完毕之后，effect 出栈，改变指针指向
  - effect 内属性取值时，调用 track 方法，构建一个 {target:Map{key:Map{activeEffect:number}}} WeakMap 收集 activeEffect ReactiveEffect 收集 dep

- trigger 实现

  - 设置值的时候，判断该对象是否有关联 effect，再将取出来的 dep 数组依次执行 ReactiveEffect.run()

- effect 返回一个 runner 函数，将 ReactiveEffect 挂载到 runner 函数上
