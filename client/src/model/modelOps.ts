import { getCatalogEntry } from './catalog'
import { normalizePropPatch } from './limits'
import type {
  ComponentProps,
  ComponentTypeId,
  InterfaceModel,
  LinkKindId,
  UiComponent,
  UiLink,
} from './types'

let seq = 1

function nextId(prefix: string): string {
  const id = `${prefix}_${seq}`
  seq += 1
  return id
}

export function createEmptyModel(title = 'Новый интерфейс'): InterfaceModel {
  return {
    id: `ui_${Date.now().toString(36)}_${seq++}`,
    title,
    components: [],
    links: [],
  }
}

function cloneModel(model: InterfaceModel): InterfaceModel {
  return structuredClone(model)
}

export function addComponent(
  model: InterfaceModel,
  typeId: ComponentTypeId,
): { model: InterfaceModel; componentId: string } {
  const catalog = getCatalogEntry(typeId)
  const index = model.components.length
  const component: UiComponent = {
    id: nextId('cmp'),
    typeId,
    props: {
      ...structuredClone(catalog.defaults),
      x: 24 + (index % 4) * 24,
      y: 24 + index * 28,
      order: index + 1,
    },
  }

  const next = cloneModel(model)
  next.components.push(component)
  return { model: next, componentId: component.id }
}

export function updateComponentProps(
  model: InterfaceModel,
  componentId: string,
  patch: Partial<ComponentProps>,
): InterfaceModel {
  const next = cloneModel(model)
  const item = next.components.find((c) => c.id === componentId)
  if (!item) {
    return model
  }
  item.props = { ...item.props, ...normalizePropPatch(patch) }
  return next
}

export function moveComponentLayer(
  model: InterfaceModel,
  componentId: string,
  direction: 'up' | 'down',
): InterfaceModel {
  const sorted = [...model.components].sort(
    (a, b) => a.props.order - b.props.order,
  )
  const index = sorted.findIndex((c) => c.id === componentId)
  if (index < 0) {
    return model
  }
  const swapWith = direction === 'up' ? index + 1 : index - 1
  if (swapWith < 0 || swapWith >= sorted.length) {
    return model
  }
  const next = cloneModel(model)
  const a = next.components.find((c) => c.id === sorted[index].id)
  const b = next.components.find((c) => c.id === sorted[swapWith].id)
  if (!a || !b) {
    return model
  }
  const orderA = a.props.order
  a.props.order = b.props.order
  b.props.order = orderA
  return next
}

export function removeComponent(
  model: InterfaceModel,
  componentId: string,
): InterfaceModel {
  return removeComponents(model, [componentId])
}

export function removeComponents(
  model: InterfaceModel,
  componentIds: string[],
): InterfaceModel {
  if (componentIds.length === 0) {
    return model
  }
  const drop = new Set(componentIds)
  const next = cloneModel(model)
  next.components = next.components.filter((c) => !drop.has(c.id))
  next.links = next.links.filter(
    (l) => !drop.has(l.sourceId) && !drop.has(l.targetId),
  )
  return next
}

export function addLink(
  model: InterfaceModel,
  kind: LinkKindId,
  sourceId: string,
  targetId: string,
): InterfaceModel {
  if (sourceId === targetId) {
    return model
  }
  const exists = model.links.some(
    (l) =>
      l.kind === kind && l.sourceId === sourceId && l.targetId === targetId,
  )
  if (exists) {
    return model
  }

  const link: UiLink = {
    id: nextId('lnk'),
    kind,
    sourceId,
    targetId,
  }
  const next = cloneModel(model)
  next.links.push(link)
  return next
}

export function removeLink(
  model: InterfaceModel,
  linkId: string,
): InterfaceModel {
  const next = cloneModel(model)
  next.links = next.links.filter((l) => l.id !== linkId)
  return next
}

export type EditorClipboard = {
  components: UiComponent[]
  links: UiLink[]
}

export function takeClipboard(
  model: InterfaceModel,
  componentIds: string[],
): EditorClipboard | null {
  if (componentIds.length === 0) {
    return null
  }
  const idSet = new Set(componentIds)
  const components = model.components
    .filter((c) => idSet.has(c.id))
    .map((c) => structuredClone(c))
  if (components.length === 0) {
    return null
  }
  const links = model.links
    .filter((l) => idSet.has(l.sourceId) && idSet.has(l.targetId))
    .map((l) => structuredClone(l))
  return { components, links }
}

export function pasteClipboard(
  model: InterfaceModel,
  clip: EditorClipboard,
  offset = 24,
): { model: InterfaceModel; newIds: string[] } {
  if (clip.components.length === 0) {
    return { model, newIds: [] }
  }

  const next = cloneModel(model)
  const idMap = new Map<string, string>()
  const baseOrder =
    next.components.reduce((max, c) => Math.max(max, c.props.order), 0) + 1
  const newIds: string[] = []

  clip.components.forEach((component, index) => {
    const newId = nextId('cmp')
    idMap.set(component.id, newId)
    newIds.push(newId)
    next.components.push({
      id: newId,
      typeId: component.typeId,
      props: {
        ...structuredClone(component.props),
        x: Math.max(0, component.props.x + offset),
        y: Math.max(0, component.props.y + offset),
        order: baseOrder + index,
      },
    })
  })

  for (const link of clip.links) {
    const sourceId = idMap.get(link.sourceId)
    const targetId = idMap.get(link.targetId)
    if (!sourceId || !targetId) {
      continue
    }
    next.links.push({
      id: nextId('lnk'),
      kind: link.kind,
      sourceId,
      targetId,
    })
  }

  return { model: next, newIds }
}
