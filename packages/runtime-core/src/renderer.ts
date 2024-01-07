interface RendererNode {
  [key: string]: any
}

interface RendererElement extends RendererNode {}

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void
  remove(el: HostNode): void
  createElement(type: string): HostElement
  createText(text: string): HostNode
  setElementText(node: HostElement, text: string): void
  setText(node: HostNode, text: string): void
  parentNode(node: HostNode): HostElement | null
  nextSibling(node: HostNode): HostNode | null
  querySelector(selector: string): HostElement | null
}
