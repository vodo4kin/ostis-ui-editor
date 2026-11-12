import type { UiComponent, UiLink } from './types'

export function buildContainsMaps(
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

export function descendantIdsOf(
  components: UiComponent[],
  links: UiLink[],
  rootId: string,
): string[] {
  const { childrenOf } = buildContainsMaps(components, links)
  const out: string[] = []
  const seen = new Set<string>([rootId])
  const stack = [...(childrenOf.get(rootId) ?? [])]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    out.push(id)
    const children = childrenOf.get(id)
    if (children) {
      for (const childId of children) {
        stack.push(childId)
      }
    }
  }
  return out
}

export function expandWithDescendants(
  components: UiComponent[],
  links: UiLink[],
  ids: string[],
): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
    for (const childId of descendantIdsOf(components, links, id)) {
      if (!seen.has(childId)) {
        seen.add(childId)
        result.push(childId)
      }
    }
  }
  return result
}
