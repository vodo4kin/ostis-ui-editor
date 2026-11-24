import {
  ScAddr,
  ScClient,
  ScTemplate,
  ScType,
} from 'ts-sc-client'
import { connectSc } from './connection'

const DIALOG_SCHEMA = [
  'concept_ui_dialog',
  'concept_ui_user_message',
  'concept_ui_assistant_message',
  'action',
  'action_answer_ui_development_question',
  'action_initiated',
  'action_finished',
  'rrel_1',
  'rrel_2',
  'nrel_ui_dialog_message',
  'nrel_ui_value',
  'nrel_ui_message_time',
  'nrel_ui_message_state',
  'nrel_ui_answer_source',
  'nrel_ui_id',
] as const

const SERVICE_NODE = 'concept_ui_dialog_service'
const NREL_HEARTBEAT = 'nrel_ui_service_heartbeat'
const NREL_STATE = 'nrel_ui_service_state'

const LEASE_TTL_S = Number(
  import.meta.env.VITE_DIALOG_SERVICE_LEASE_TTL_S ?? 20,
)

async function readLinkByRelation(
  client: ScClient,
  node: ScAddr,
  relation: ScAddr,
): Promise<string | null> {
  const templ = new ScTemplate()
  templ.quintuple(
    node,
    ScType.VarCommonArc,
    [ScType.VarNodeLink, '_link'],
    ScType.VarPermPosArc,
    relation,
  )
  const rows = await client.searchByTemplate(templ)
  if (rows.length === 0) {
    return null
  }
  const contents = await client.getLinkContents([rows[0].get('_link')])
  const data = contents[0]?.data
  return data === undefined ? null : String(data)
}

function heartbeatIsLive(
  heartbeatIso: string | null,
  stateJson: string | null,
): boolean {
  if (!heartbeatIso) {
    return false
  }
  try {
    if (stateJson) {
      const state = JSON.parse(stateJson) as { state?: string }
      if (state.state === 'stopped') {
        return false
      }
    }
  } catch {
    return false
  }
  const moment = Date.parse(heartbeatIso)
  if (!Number.isFinite(moment)) {
    return false
  }
  const ageS = (Date.now() - moment) / 1000
  const ttl = Number.isFinite(LEASE_TTL_S) ? LEASE_TTL_S : 20
  return ageS >= 0 && ageS <= ttl
}

export async function isDialogAssistantAvailable(
  client?: ScClient,
): Promise<boolean> {
  try {
    const sc = client ?? (await connectSc())
    const searchOnly = new ScType()
    const ids = [
      ...DIALOG_SCHEMA,
      SERVICE_NODE,
      NREL_HEARTBEAT,
      NREL_STATE,
    ] as const
    const resolved = await sc.resolveKeynodes(
      ids.map((id) => ({ id, type: searchOnly })),
    )
    if (!ids.every((id) => resolved[id]?.isValid())) {
      return false
    }

    const heartbeat = await readLinkByRelation(
      sc,
      resolved[SERVICE_NODE],
      resolved[NREL_HEARTBEAT],
    )
    const state = await readLinkByRelation(
      sc,
      resolved[SERVICE_NODE],
      resolved[NREL_STATE],
    )
    return heartbeatIsLive(heartbeat, state)
  } catch {
    return false
  }
}
