import { LINK_KINDS, labelOfType } from './catalog'
import type {
  ComponentProps,
  InterfaceModel,
  PropKey,
  UiComponent,
  UiLink,
} from './types'
export type ModelChange =
  | {
      id: string
      kind: 'add_component'
      componentId: string
      label: string
    }
  | {
      id: string
      kind: 'remove_component'
      componentId: string
      label: string
      component: UiComponent
    }
  | {
      id: string
      kind: 'prop'
      componentId: string
      label: string
      prop: PropKey
      from: string
      to: string
    }
  | {
      id: string
      kind: 'add_link'
      linkId: string
      link: UiLink
      label: string
    }
  | {
      id: string
      kind: 'remove_link'
      linkId: string
      link: UiLink
      label: string
    }

function componentTitle(component: UiComponent): string {
  return component.props.name || labelOfType(component.typeId)
}

function linkLabel(
  link: UiLink,
  components: UiComponent[],
): string {
  const kind =
    LINK_KINDS.find((item) => item.id === link.kind)?.label ?? link.kind
  const source = components.find((c) => c.id === link.sourceId)
  const target = components.find((c) => c.id === link.targetId)
  const from = source ? componentTitle(source) : link.sourceId
  const to = target ? componentTitle(target) : link.targetId
  return `${kind}: ${from} → ${to}`
}

export function diffModels(
  baseline: InterfaceModel,
  current: InterfaceModel,
): ModelChange[] {
  const changes: ModelChange[] = []
  const baseComps = new Map(baseline.components.map((c) => [c.id, c]))
  const curComps = new Map(current.components.map((c) => [c.id, c]))

  for (const [id, component] of curComps) {
    if (!baseComps.has(id)) {
      changes.push({
        id: `add_component:${id}`,
        kind: 'add_component',
        componentId: id,
        label: `+ ${componentTitle(component)}`,
      })
    }
  }

  for (const [id, component] of baseComps) {
    if (!curComps.has(id)) {
      changes.push({
        id: `remove_component:${id}`,
        kind: 'remove_component',
        componentId: id,
        label: `− ${componentTitle(component)}`,
        component,
      })
    }
  }

  for (const [id, currentComp] of curComps) {
    const baseComp = baseComps.get(id)
    if (!baseComp) {
      continue
    }
    const keys = Object.keys(currentComp.props) as PropKey[]
    for (const key of keys) {
      const from = String(baseComp.props[key])
      const to = String(currentComp.props[key])
      if (from !== to) {
        changes.push({
          id: `prop:${id}:${key}`,
          kind: 'prop',
          componentId: id,
          label: `${componentTitle(currentComp)}.${key}: ${from} → ${to}`,
          prop: key,
          from,
          to,
        })
      }
    }
  }

  const baseLinks = new Map(baseline.links.map((l) => [l.id, l]))
  const curLinks = new Map(current.links.map((l) => [l.id, l]))
  const allComps = [...baseline.components, ...current.components]

  for (const [id, link] of curLinks) {
    if (!baseLinks.has(id)) {
      changes.push({
        id: `add_link:${id}`,
        kind: 'add_link',
        linkId: id,
        link,
        label: `+ связь ${linkLabel(link, allComps)}`,
      })
    }
  }

  for (const [id, link] of baseLinks) {
    if (!curLinks.has(id)) {
      changes.push({
        id: `remove_link:${id}`,
        kind: 'remove_link',
        linkId: id,
        link,
        label: `− связь ${linkLabel(link, allComps)}`,
      })
    }
  }

  return changes
}

function parsePropValue(
  key: PropKey,
  raw: string,
  sample: ComponentProps,
): ComponentProps[PropKey] {
  const current = sample[key]
  if (typeof current === 'boolean') {
    return raw === 'true'
  }
  if (typeof current === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : current
  }
  return raw
}

export function revertChange(
  model: InterfaceModel,
  baseline: InterfaceModel,
  change: ModelChange,
): InterfaceModel {
  const next: InterfaceModel = {
    ...model,
    components: model.components.map((c) => ({
      ...c,
      props: { ...c.props },
    })),
    links: [...model.links],
  }

  switch (change.kind) {
    case 'add_component': {
      next.components = next.components.filter(
        (c) => c.id !== change.componentId,
      )
      next.links = next.links.filter(
        (l) =>
          l.sourceId !== change.componentId &&
          l.targetId !== change.componentId,
      )
      break
    }
    case 'remove_component': {
      if (!next.components.some((c) => c.id === change.componentId)) {
        next.components.push(structuredClone(change.component))
      }
      break
    }
    case 'prop': {
      const target = next.components.find((c) => c.id === change.componentId)
      const base = baseline.components.find((c) => c.id === change.componentId)
      if (target && base) {
        target.props[change.prop] = parsePropValue(
          change.prop,
          change.from,
          base.props,
        ) as never
      }
      break
    }
    case 'add_link': {
      next.links = next.links.filter((l) => l.id !== change.linkId)
      break
    }
    case 'remove_link': {
      if (!next.links.some((l) => l.id === change.linkId)) {
        next.links.push(structuredClone(change.link))
      }
      break
    }
  }

  return next
}

export function cloneModel(model: InterfaceModel): InterfaceModel {
  return structuredClone(model)
}

export function changeTargetId(change: ModelChange): string | null {
  if (
    change.kind === 'add_component' ||
    change.kind === 'remove_component' ||
    change.kind === 'prop'
  ) {
    return change.componentId
  }
  return change.link.sourceId
}
