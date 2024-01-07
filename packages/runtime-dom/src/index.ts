import { nodeOps } from './nodeOps'
import { patchProp } from './patchProps'

const renderOptions = Object.assign(nodeOps, { patchProp })

console.log(renderOptions)
