import { ScAddr, ScClient, ScTemplate, ScType } from 'ts-sc-client'
import { getCatalogEntry } from '../model/catalog'
import type {
  ComponentProps,
  ComponentTypeId,
  InterfaceModel,
  PropKey,
  UiComponent,
  UiLink,
} from '../model/types'
import { toIdtf } from './idtf'
import {
  ALL_PROP_KEYS,
  CLASS_INTERFACE,
  CLASS_TO_TYPE,
  PROP_TO_CLASS,
  REL,
  TYPE_TO_CLASS,
} from './names'

type Kn = Record<string, ScAddr>

function parsePropValue(key: PropKey, raw: string): ComponentProps[PropKey] {
  const sample = getCatalogEntry('button').defaults[key]
  if (typeof sample === 'boolean') {
    return (raw === 'true' || raw === '1') as ComponentProps[PropKey]
  }
  if (typeof sample === 'number') {
    const n = Number(raw)
    return (Number.isFinite(n) ? n : 0) as ComponentProps[PropKey]
  }
  return raw as ComponentProps[PropKey]
}

async function findKeynodes(client: ScClient, ids: string[]): Promise<Kn> {
  const unique = [...new Set(ids)]
  const params = unique.map((id) => ({ id, type: new ScType() }))
  const map = await client.resolveKeynodes(params)
  for (const id of unique) {
    if (!map[id]?.isValid()) {
      throw new Error(`В БЗ не найден ключ: ${id}`)
    }
  }
  return map
}

async function readLinkString(client: ScClient, link: ScAddr): Promise<string> {
  const contents = await client.getLinkContents([link])
  const data = contents[0]?.data
  return data == null ? '' : String(data)
}

async function readIdContent(
  client: ScClient,
  node: ScAddr,
  nrelId: ScAddr,
): Promise<string> {
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
    return ''
  }
  return readLinkString(client, rows[0].get('_id'))
}

async function readPropValue(
  client: ScClient,
  owner: ScAddr,
  key: PropKey,
  kn: Kn,
): Promise<string | null> {
  const className = PROP_TO_CLASS[key]
  const classAddr = kn[className]
  const valueRel = kn[REL.value]
  const templ = new ScTemplate()
  templ.triple(classAddr, ScType.VarPermPosArc, [ScType.VarNode, '_prop'])
  templ.triple('_prop', ScType.VarPermPosArc, owner)
  templ.quintuple(
    '_prop',
    ScType.VarCommonArc,
    [ScType.VarNodeLink, '_val'],
    ScType.VarPermPosArc,
    valueRel,
  )
  const rows = await client.searchByTemplate(templ)
  if (!rows.length) {
    return null
  }
  return readLinkString(client, rows[0].get('_val'))
}

async function readComponentType(
  client: ScClient,
  node: ScAddr,
  kn: Kn,
): Promise<ComponentTypeId | null> {
  for (const className of Object.keys(TYPE_TO_CLASS).map(
    (typeId) => TYPE_TO_CLASS[typeId as ComponentTypeId],
  )) {
    const classAddr = kn[className]
    const templ = new ScTemplate()
    templ.triple(classAddr, ScType.VarPermPosArc, node)
    const rows = await client.searchByTemplate(templ)
    if (rows.length) {
      return CLASS_TO_TYPE[className]
    }
  }
  return null
}

async function readComponent(
  client: ScClient,
  node: ScAddr,
  kn: Kn,
): Promise<UiComponent | null> {
  const typeId = await readComponentType(client, node, kn)
  if (!typeId) {
    return null
  }

  const idFromLink = await readIdContent(client, node, kn[REL.id])
  const id = idFromLink || String(node.value)
  const defaults = structuredClone(getCatalogEntry(typeId).defaults)
  const props = { ...defaults } as ComponentProps

  for (const key of ALL_PROP_KEYS) {
    const raw = await readPropValue(client, node, key, kn)
    if (raw == null) {
      continue
    }
    props[key] = parsePropValue(key, raw) as never
  }

  return { id, typeId, props }
}

export async function modelFromSc(
  client: ScClient,
  modelId: string,
): Promise<InterfaceModel> {
  const typeClasses = Object.values(TYPE_TO_CLASS)
  const propClasses = Object.values(PROP_TO_CLASS)
  const kn = await findKeynodes(client, [
    CLASS_INTERFACE,
    REL.contains,
    REL.has_component,
    REL.id,
    REL.value,
    ...typeClasses,
    ...propClasses,
  ])

  const ifaceIdtf = toIdtf(modelId)
  const ifaceMap = await client.resolveKeynodes([
    { id: ifaceIdtf, type: new ScType() },
  ])
  const iface = ifaceMap[ifaceIdtf]
  if (!iface.isValid()) {
    throw new Error(`Интерфейс не найден в БЗ: ${ifaceIdtf}`)
  }

  const isIface = await client.searchByTemplate(
    (() => {
      const t = new ScTemplate()
      t.triple(kn[CLASS_INTERFACE], ScType.VarPermPosArc, iface)
      return t
    })(),
  )
  if (!isIface.length) {
    throw new Error(`Узел ${ifaceIdtf} не является concept_ui_interface`)
  }

  const idContent = await readIdContent(client, iface, kn[REL.id])
  const titleRaw = await readPropValue(client, iface, 'name', kn)

  const hasComp = new ScTemplate()
  hasComp.quintuple(
    iface,
    ScType.VarCommonArc,
    [ScType.VarNode, '_comp'],
    ScType.VarPermPosArc,
    kn[REL.has_component],
  )
  const compRows = await client.searchByTemplate(hasComp)

  const components: UiComponent[] = []
  const addrById = new Map<string, ScAddr>()

  for (const row of compRows) {
    const addr = row.get('_comp')
    const component = await readComponent(client, addr, kn)
    if (!component) {
      continue
    }
    if (addrById.has(component.id)) {
      continue
    }
    components.push(component)
    addrById.set(component.id, addr)
  }

  const links: UiLink[] = []
  const seenLinks = new Set<string>()
  let linkSeq = 1

  for (const component of components) {
    const sourceAddr = addrById.get(component.id)
    if (!sourceAddr) {
      continue
    }
    const containsTempl = new ScTemplate()
    containsTempl.quintuple(
      sourceAddr,
      ScType.VarCommonArc,
      [ScType.VarNode, '_child'],
      ScType.VarPermPosArc,
      kn[REL.contains],
    )
    const childRows = await client.searchByTemplate(containsTempl)
    for (const row of childRows) {
      const childAddr = row.get('_child')
      const child = components.find((c) => {
        const a = addrById.get(c.id)
        return a && a.equal(childAddr)
      })
      if (!child) {
        continue
      }
      const key = `${component.id}->${child.id}`
      if (seenLinks.has(key)) {
        continue
      }
      seenLinks.add(key)
      links.push({
        id: `lnk_${linkSeq}`,
        kind: 'contains',
        sourceId: component.id,
        targetId: child.id,
      })
      linkSeq += 1
    }
  }

  return {
    id: idContent || modelId,
    title: titleRaw ?? 'Интерфейс',
    components,
    links,
  }
}

export type ScInterfaceRef = {
  id: string
  title: string
}

export async function listInterfaces(
  client: ScClient,
): Promise<ScInterfaceRef[]> {
  const kn = await findKeynodes(client, [
    CLASS_INTERFACE,
    REL.id,
    REL.value,
    PROP_TO_CLASS.name,
  ])
  const templ = new ScTemplate()
  templ.triple(kn[CLASS_INTERFACE], ScType.VarPermPosArc, [
    ScType.VarNode,
    '_iface',
  ])
  const rows = await client.searchByTemplate(templ)
  const items: ScInterfaceRef[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const addr = row.get('_iface')
    const id = await readIdContent(client, addr, kn[REL.id])
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    const title = (await readPropValue(client, addr, 'name', kn)) || id
    items.push({ id, title })
  }

  items.sort((a, b) =>
    a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }),
  )
  return items
}

export async function listInterfaceIdtfs(client: ScClient): Promise<string[]> {
  const items = await listInterfaces(client)
  return items.map((item) => item.id)
}
