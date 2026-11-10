import {
  ScAddr,
  ScClient,
  ScLinkContent,
  ScLinkContentType,
  ScTemplate,
  ScType,
} from 'ts-sc-client'
import { normalizeScContent } from '../model/limits'
import type { ComponentProps, InterfaceModel, PropKey } from '../model/types'
import { toIdtf } from './idtf'
import { ALL_PROP_KEYS, REL } from './names'

function formatPropValue(value: ComponentProps[PropKey]): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return normalizeScContent(String(value))
}

async function findKeynodes(client: ScClient, ids: string[]): Promise<Record<string, ScAddr>> {
  const unique = [...new Set(ids)]
  const map = await client.resolveKeynodes(
    unique.map((id) => ({ id, type: new ScType() })),
  )
  return map
}

async function findValueLink(
  client: ScClient,
  propNode: ScAddr,
  nrelValue: ScAddr,
): Promise<ScAddr | null> {
  const templ = new ScTemplate()
  templ.quintuple(
    propNode,
    ScType.VarCommonArc,
    [ScType.VarNodeLink, '_val'],
    ScType.VarPermPosArc,
    nrelValue,
  )
  const rows = await client.searchByTemplate(templ)
  if (!rows.length) {
    return null
  }
  return rows[0].get('_val')
}

async function setStringLink(
  client: ScClient,
  link: ScAddr,
  value: string,
): Promise<void> {
  const ok = await client.setLinkContents([
    new ScLinkContent(value, ScLinkContentType.String, link),
  ])
  if (!ok[0]) {
    throw new Error('Не удалось обновить содержимое ссылки в БЗ')
  }
}

async function syncOwnerProps(
  client: ScClient,
  ownerIdtf: string,
  props: Partial<Record<PropKey, ComponentProps[PropKey]>>,
  nrelValue: ScAddr,
): Promise<void> {
  const keys = Object.keys(props) as PropKey[]
  if (!keys.length) {
    return
  }
  const propIdtfs = keys.map((key) => `${ownerIdtf}_${key}`)
  const nodes = await findKeynodes(client, propIdtfs)
  for (const key of keys) {
    const propNode = nodes[`${ownerIdtf}_${key}`]
    if (!propNode?.isValid()) {
      continue
    }
    const link = await findValueLink(client, propNode, nrelValue)
    if (!link) {
      continue
    }
    await setStringLink(client, link, formatPropValue(props[key] as ComponentProps[PropKey]))
  }
}

async function syncIdLink(
  client: ScClient,
  nodeIdtf: string,
  idValue: string,
  nrelId: ScAddr,
): Promise<void> {
  const nodes = await findKeynodes(client, [nodeIdtf])
  const node = nodes[nodeIdtf]
  if (!node?.isValid()) {
    return
  }
  const templ = new ScTemplate()
  templ.quintuple(
    node,
    ScType.VarCommonArc,
    [ScType.VarNodeLink, '_id'],
    ScType.VarPermPosArc,
    nrelId,
  )
  const rows = await client.searchByTemplate(templ)
  if (!rows.length) {
    return
  }
  await setStringLink(client, rows[0].get('_id'), idValue)
}

export async function syncModelValues(
  client: ScClient,
  model: InterfaceModel,
): Promise<void> {
  const kn = await findKeynodes(client, [REL.value, REL.id])
  const nrelValue = kn[REL.value]
  const nrelId = kn[REL.id]
  if (!nrelValue?.isValid() || !nrelId?.isValid()) {
    throw new Error('В БЗ нет nrel_ui_value / nrel_ui_id')
  }

  const iface = toIdtf(model.id)
  await syncIdLink(client, iface, model.id, nrelId)
  await syncOwnerProps(client, iface, { name: model.title }, nrelValue)

  for (const component of model.components) {
    const cid = toIdtf(component.id)
    await syncIdLink(client, cid, component.id, nrelId)
    const props: Partial<Record<PropKey, ComponentProps[PropKey]>> = {}
    for (const key of ALL_PROP_KEYS) {
      props[key] = component.props[key]
    }
    await syncOwnerProps(client, cid, props, nrelValue)
  }
}
