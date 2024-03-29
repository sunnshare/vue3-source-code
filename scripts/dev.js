import minimist from 'minimist'

import { execa } from 'execa'

// { _: [ 'reactivity' ], f: 'global', s: true }
const args = minimist(process.argv.slice(2))
const target = args._.length ? args._[0] : 'runtime-dom'
const formats = args.f || 'global'
const sourcemap = args.s || false

execa(
  'rollup',
  [
    '-cw', // --config --watch
    '--environment',
    [
      `TARGET:${target}`,
      `FORMATS:${formats}`,
      sourcemap ? `SOURCE_MAP:true` : ``,
    ]
      .filter(Boolean)
      .join(','),
  ],
  {
    stdio: 'inherit', // 子进程输出是在命令行中输出
  }
)
