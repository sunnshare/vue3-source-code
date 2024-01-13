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

## diff 算法

### 同级比较

- 元素不相同(type 和 key 都不相同) => 直接替换不用比较 ，元素相同 => 比较属性 => 比较子元素

- 数组 -> 文本，unmountChildren(数组)，hostSetElementText(文本)

- 数组 -> 空，unmountChildren(数组)

- 文本 -> 空，hostSetElementText(空)

- 文本 -> 数组，mountChildren(数组)

- 数组 -> 数组 => 深层次 diff patchKeyedChildren

### 顺序比较

i 为 0，e1 为旧节点的最后一位索引值，e2 为新节点最后一位的索引值

1. 从前往后比，节点相同则 i + 1，节点不同则跳出循环，说明前面相同的已经比较完了

2. 从后往前比，节点相同 e1 - 1; e2 - 1; 节点不同则跳出循环，说明后面的已经比较完了

3. i > e1 && i <= e2 说明 i 到 e2 之间的为新节点(包含 i 和 e2)，根据 e2 的下一个节点是否存在判断新节点插入的位置

4. i > e2 说明 i 到 e1 之间的为旧节点(包含 i 和 e1)，删除多余节点

### 乱序比较

5.  s1 为旧节点第一位索引值，s2 为新节点第一位索引值

    1.  根据新节点的 key 对应 index 创建一个 Map 映射 keyToNewIndexMap

    2.  创建一个全为 0 的索引数组 newIndexToOldIndexMap，用于记录新节点对应在旧节点中的索引，进行更好的复用
        循环旧节点，如果在 keyToNewIndexMap 中存在，则记录 newIndexToOldIndexMap[新节点索引] = 旧节点索引值，并且进行 patch 两个节点

    3.  从后开始循环 newIndexToOldIndexMap，让最后一个节点作为参照物
        如果当前记录的值为 0，则调用 patch 方法，新增节点变成真实节点再插入
        如果当前记录的值不为 0，则进行[最长递增子序列优化](./packages/shared/src/algorithm.ts)插入
