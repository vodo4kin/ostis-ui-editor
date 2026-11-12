import { labelOfType } from '../model/catalog'
import { buildContainsMaps } from '../model/containsRelations'
import type { UiComponent, UiLink } from '../model/types'

export type ContainsNode = {
  id: string
  label: string
  children: ContainsNode[]
}

export { ancestorIdsFor } from '../model/containsRelations'

function componentLabel(component: UiComponent): string {
  return component.props.name || labelOfType(component.typeId)
}

export function buildContainsForest(
  components: UiComponent[],
  links: UiLink[],
): ContainsNode[] {
  const { byId, childrenOf } = buildContainsMaps(components, links)

  const childIds = new Set<string>()
  for (const ids of childrenOf.values()) {
    for (const id of ids) {
      childIds.add(id)
    }
  }

  function buildNode(id: string, trail: Set<string>): ContainsNode | null {
    const component = byId.get(id)
    if (!component || trail.has(id)) {
      return null
    }
    const nextTrail = new Set(trail)
    nextTrail.add(id)
    const childNodes: ContainsNode[] = []
    for (const childId of childrenOf.get(id) ?? []) {
      const child = buildNode(childId, nextTrail)
      if (child) {
        childNodes.push(child)
      }
    }
    return {
      id,
      label: componentLabel(component),
      children: childNodes,
    }
  }

  const roots: ContainsNode[] = []
  for (const component of components) {
    if (childIds.has(component.id)) {
      continue
    }
    const node = buildNode(component.id, new Set())
    if (node) {
      roots.push(node)
    }
  }
  return roots
}
