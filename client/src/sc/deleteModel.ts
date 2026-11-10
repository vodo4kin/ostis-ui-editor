import { ScAddr, ScClient, ScTemplate, ScType } from 'ts-sc-client'
import type { InterfaceModel } from '../model/types'
import { toIdtf } from './idtf'
import { ALL_PROP_KEYS, REL } from './names'

async function findNodes(
  client: ScClient,
  ids: string[],
): Promise<ScAddr[]> {
  if (ids.length === 0) {
    return []
  }
  const map = await client.resolveKeynodes(
    ids.map((id) => ({ id, type: new ScType() })),
  )
  return ids
    .map((id) => map[id])
    .filter((addr): addr is ScAddr => Boolean(addr?.isValid()))
}

async function collectRelLinks(
  client: ScClient,
  owners: ScAddr[],
  rel: ScAddr,
): Promise<ScAddr[]> {
  const links: ScAddr[] = []
  const seen = new Set<number>()
  for (const owner of owners) {
    const templ = new ScTemplate()
    templ.quintuple(
      owner,
      ScType.VarCommonArc,
      [ScType.VarNodeLink, '_link'],
      ScType.VarPermPosArc,
      rel,
    )
    const rows = await client.searchByTemplate(templ)
    for (const row of rows) {
      const link = row.get('_link')
      if (!seen.has(link.value)) {
        seen.add(link.value)
        links.push(link)
      }
    }
  }
  return links
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
  const contents = await client.getLinkContents([rows[0].get('_id')])
  const data = contents[0]?.data
  return data == null ? '' : String(data)
}

async function eraseAddrs(client: ScClient, addrs: ScAddr[]): Promise<void> {
  const toErase: ScAddr[] = []
  const seen = new Set<number>()
  for (const addr of addrs) {
    if (!seen.has(addr.value)) {
      seen.add(addr.value)
      toErase.push(addr)
    }
  }
  if (toErase.length === 0) {
    return
  }
  const ok = await client.eraseElements(toErase)
  if (!ok) {
    throw new Error('Не удалось удалить интерфейс из БЗ')
  }
}

export async function eraseInterfaceById(
  client: ScClient,
  modelId: string,
): Promise<void> {
  const ifaceIdtf = toIdtf(modelId)
  const relMap = await client.resolveKeynodes([
    { id: REL.has_component, type: new ScType() },
    { id: REL.id, type: new ScType() },
    { id: REL.value, type: new ScType() },
    { id: ifaceIdtf, type: new ScType() },
  ])
  const nrelHas = relMap[REL.has_component]
  const nrelId = relMap[REL.id]
  const nrelValue = relMap[REL.value]
  const iface = relMap[ifaceIdtf]
  if (!nrelHas?.isValid() || !nrelId?.isValid() || !nrelValue?.isValid()) {
    throw new Error('В БЗ нет nrel_ui_has_component / nrel_ui_id / nrel_ui_value')
  }
  if (!iface?.isValid()) {
    return
  }

  const hasComp = new ScTemplate()
  hasComp.quintuple(
    iface,
    ScType.VarCommonArc,
    [ScType.VarNode, '_comp'],
    ScType.VarPermPosArc,
    nrelHas,
  )
  const compRows = await client.searchByTemplate(hasComp)

  const owners: ScAddr[] = [iface]
  const ownerIdtfs = [ifaceIdtf]
  const seenOwner = new Set<number>([iface.value])

  for (const row of compRows) {
    const addr = row.get('_comp')
    if (seenOwner.has(addr.value)) {
      continue
    }
    seenOwner.add(addr.value)
    owners.push(addr)
    const idContent = await readIdContent(client, addr, nrelId)
    ownerIdtfs.push(idContent ? toIdtf(idContent) : `n_${addr.value}`)
  }

  const propIdtfs = ownerIdtfs.flatMap((ownerIdtf, index) => {
    if (index === 0) {
      return [`${ownerIdtf}_name`]
    }
    return ALL_PROP_KEYS.map((key) => `${ownerIdtf}_${key}`)
  })

  const props = await findNodes(client, propIdtfs)
  const idLinks = await collectRelLinks(client, owners, nrelId)
  const valueLinks = await collectRelLinks(client, props, nrelValue)
  await eraseAddrs(client, [...idLinks, ...valueLinks, ...props, ...owners])
}

export async function deleteModelFromSc(
  model: InterfaceModel,
  client: ScClient,
): Promise<void> {
  await eraseInterfaceById(client, model.id)
}
