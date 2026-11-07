import { labelOfType } from '../model/catalog'
import type { UiComponent, UiLink } from '../model/types'

export type ContainsNode = {
  id: string
  label: string
  children: ContainsNode[]
}

function componentLabel(component: UiComponent): string {
  return component.props.name || labelOfType(component.typeId)
}

function buildContainsMaps(
  components: UiComponent[],
  links: UiLink[],
): {
  byId: Map<string, UiComponent>
  childrenOf: Map<string, string[]>
  parentOf: Map<string, string>
} {
  const byId = new Map(components.map((c) => [c.id, c]))
  const childrenOf = new Map<string, string[]>()
  const parentOf = new Map<string, string>()

  for (const link of links) {
    if (link.kind !== 'contains') {
      continue
    }
    if (!byId.has(link.sourceId) || !byId.has(link.targetId)) {
      continue
    }
    const list = childrenOf.get(link.sourceId)
    if (list) {
      list.push(link.targetId)
    } else {
      childrenOf.set(link.sourceId, [link.targetId])
    }
    parentOf.set(link.targetId, link.sourceId)
  }

  return { byId, childrenOf, parentOf }
}

export function ancestorIdsFor(
  components: UiComponent[],
  links: UiLink[],
  componentId: string,
): string[] {
  const { parentOf } = buildContainsMaps(components, links)
  const ancestors: string[] = []
  let current: string | undefined = parentOf.get(componentId)
  const seen = new Set<string>()
  while (current && !seen.has(current)) {
    ancestors.push(current)
    seen.add(current)
    current = parentOf.get(current)
  }
  return ancestors
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
