import { normalizeScContent } from '../model/limits'
import type { ComponentProps, InterfaceModel, PropKey } from '../model/types'
import { escapeScsContent, toIdtf } from './idtf'
import {
  ALL_PROP_KEYS,
  CLASS_INTERFACE,
  PROP_TO_CLASS,
  REL,
  TYPE_TO_CLASS,
} from './names'

function formatPropValue(value: ComponentProps[PropKey]): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return normalizeScContent(String(value))
}

function emitProp(
  ownerIdtf: string,
  key: PropKey,
  value: ComponentProps[PropKey],
): string {
  const propNode = `${ownerIdtf}_${key}`
  const className = PROP_TO_CLASS[key]
  const content = escapeScsContent(formatPropValue(value))
  return [
    `${propNode}`,
    `<- ${className};`,
    `=> ${REL.value}: [${content}];`,
    `-> ${ownerIdtf};;`,
  ].join('\n')
}

export function modelToScs(model: InterfaceModel): string {
  const iface = toIdtf(model.id)
  const parts: string[] = []

  parts.push(`${iface}`)
  parts.push(`<- ${CLASS_INTERFACE};;`)
  parts.push('')
  parts.push(`${iface} => ${REL.id}: [${escapeScsContent(model.id)}];;`)
  parts.push('')
  parts.push(emitProp(iface, 'name', model.title))
  parts.push('')

  for (const component of model.components) {
    const cid = toIdtf(component.id)
    const typeClass = TYPE_TO_CLASS[component.typeId]

    parts.push(`${cid}`)
    parts.push(`<- ${typeClass};;`)
    parts.push('')
    parts.push(`${cid} => ${REL.id}: [${escapeScsContent(component.id)}];;`)
    parts.push('')

    for (const key of ALL_PROP_KEYS) {
      parts.push(emitProp(cid, key, component.props[key]))
      parts.push('')
    }
  }

  for (const component of model.components) {
    parts.push(
      `${iface} => ${REL.has_component}: ${toIdtf(component.id)};;`,
    )
  }
  if (model.components.length > 0) {
    parts.push('')
  }

  const childTargets = new Set(
    model.links.filter((l) => l.kind === 'contains').map((l) => l.targetId),
  )

  for (const component of model.components) {
    if (childTargets.has(component.id)) {
      continue
    }
    parts.push(`${iface} => ${REL.contains}: ${toIdtf(component.id)};;`)
  }

  for (const link of model.links) {
    if (link.kind !== 'contains') {
      continue
    }
    parts.push(
      `${toIdtf(link.sourceId)} => ${REL.contains}: ${toIdtf(link.targetId)};;`,
    )
  }

  let text = parts.join('\n').replace(/\n+$/g, '')
  return `${text}\n`
}
