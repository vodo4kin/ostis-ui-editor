import { getCatalogEntry } from './catalog'
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
    id: nextId('ui'),
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
  item.props = { ...item.props, ...patch }
  return next
}

export function removeComponent(
  model: InterfaceModel,
  componentId: string,
): InterfaceModel {
  const next = cloneModel(model)
  next.components = next.components.filter((c) => c.id !== componentId)
  next.links = next.links.filter(
    (l) => l.sourceId !== componentId && l.targetId !== componentId,
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
