import {
  ScAddr,
  ScClient,
  ScConstruction,
  ScEventSubscriptionParams,
  ScEventType,
  ScTemplate,
  ScType,
} from 'ts-sc-client'
import { connectSc } from './connection'
import { toIdtf } from './idtf'

const ACTION_CLASS = 'action_translate_sc_to_html'
const NREL_HTML = 'nrel_html_representation'
const PREVIEW_TIMEOUT_MS = 30_000
const PROBE_TIMEOUT_MS = 4_000

type PreviewKeynodes = {
  actionClass: ScAddr
  actionInitiated: ScAddr
  finishedOk: ScAddr
  finishedFail: ScAddr
  rrel1: ScAddr
  nrelHtml: ScAddr
}

type ActionOutcome = 'ok' | 'fail'

async function findKeynode(
  client: ScClient,
  id: string,
): Promise<ScAddr | null> {
  const map = await client.resolveKeynodes([
    { id, type: new ScType() },
  ])
  const addr = map[id]
  return addr?.isValid() ? addr : null
}

async function isMemberOf(
  client: ScClient,
  classNode: ScAddr,
  element: ScAddr,
): Promise<boolean> {
  const templ = new ScTemplate()
  templ.triple(classNode, ScType.VarPermPosArc, element)
  const rows = await client.searchByTemplate(templ)
  return rows.length > 0
}

function waitActionOutcome(
  client: ScClient,
  action: ScAddr,
  finishedOk: ScAddr,
  finishedFail: ScAddr,
  timeoutMs: number,
): Promise<ActionOutcome> {
  return new Promise((resolve, reject) => {
    let settled = false
    let eventId: number | null = null

    const finish = async (result?: ActionOutcome, err?: Error) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      if (eventId != null) {
        try {
          await client.destroyElementaryEventSubscriptions(eventId)
        } catch {
          /* ignore */
        }
      }
      if (err) {
        reject(err)
      } else {
        resolve(result ?? 'ok')
      }
    }

    const timer = setTimeout(() => {
      void finish(undefined, new Error('error.agentWaitTimeout'))
    }, timeoutMs)

    void (async () => {
      try {
        if (await isMemberOf(client, finishedOk, action)) {
          await finish('ok')
          return
        }
        if (await isMemberOf(client, finishedFail, action)) {
          await finish('fail')
          return
        }

        const [sub] = await client.createElementaryEventSubscriptions([
          new ScEventSubscriptionParams(
            action,
            ScEventType.AfterGenerateIncomingArc,
            (_el, _edge, other) => {
              if (other.value === finishedOk.value) {
                void finish('ok')
              } else if (other.value === finishedFail.value) {
                void finish('fail')
              }
            },
          ),
        ])
        eventId = sub.id

        if (await isMemberOf(client, finishedOk, action)) {
          await finish('ok')
          return
        }
        if (await isMemberOf(client, finishedFail, action)) {
          await finish('fail')
        }
      } catch (err) {
        await finish(
          undefined,
          err instanceof Error ? err : new Error('error.agentWaitFailed'),
        )
      }
    })()
  })
}

async function requireKeynode(client: ScClient, id: string): Promise<ScAddr> {
  const addr = await findKeynode(client, id)
  if (!addr) {
    throw new Error(`error.keyMissing|${id}`)
  }
  return addr
}

async function resolvePreviewKeynodes(
  client: ScClient,
): Promise<PreviewKeynodes> {
  return {
    actionClass: await requireKeynode(client, ACTION_CLASS),
    actionInitiated: await requireKeynode(client, 'action_initiated'),
    finishedOk: await requireKeynode(
      client,
      'action_finished_successfully',
    ),
    finishedFail: await requireKeynode(
      client,
      'action_finished_unsuccessfully',
    ),
    rrel1: await requireKeynode(client, 'rrel_1'),
    nrelHtml: await requireKeynode(client, NREL_HTML),
  }
}

export async function isHtmlTranslatorAvailable(
  client?: ScClient,
): Promise<boolean> {
  try {
    const sc = client ?? (await connectSc())
    const actionClass = await findKeynode(sc, ACTION_CLASS)
    const nrelHtml = await findKeynode(sc, NREL_HTML)
    const actionInitiated = await findKeynode(sc, 'action_initiated')
    const finishedOk = await findKeynode(
      sc,
      'action_finished_successfully',
    )
    const finishedFail = await findKeynode(
      sc,
      'action_finished_unsuccessfully',
    )
    if (
      !actionClass ||
      !nrelHtml ||
      !actionInitiated ||
      !finishedOk ||
      !finishedFail
    ) {
      return false
    }

    const [actionType] = await sc.getElementsTypes([actionClass])
    if (!actionType?.isNode() || !actionType.isClass()) {
      return false
    }

    const build = new ScConstruction()
    build.generateNode(ScType.ConstNode, 'action')
    build.generateConnector(ScType.ConstPermPosArc, actionClass, 'action')
    const created = await sc.generateElements(build)
    const action = created[build.getIndex('action')]
    if (!action?.isValid()) {
      return false
    }

    const waitDone = waitActionOutcome(
      sc,
      action,
      finishedOk,
      finishedFail,
      PROBE_TIMEOUT_MS,
    )
    const initiate = new ScConstruction()
    initiate.generateConnector(
      ScType.ConstPermPosArc,
      actionInitiated,
      action,
    )
    await sc.generateElements(initiate)
    await waitDone
    return true
  } catch {
    return false
  }
}

async function resolveInterfaceNode(
  client: ScClient,
  modelId: string,
): Promise<ScAddr> {
  const idtf = toIdtf(modelId)
  const iface = await findKeynode(client, idtf)
  if (!iface) {
    throw new Error('error.ifaceMissingAfterSave')
  }
  return iface
}

async function readLinkString(client: ScClient, link: ScAddr): Promise<string> {
  const contents = await client.getLinkContents([link])
  const data = contents[0]?.data
  return data == null ? '' : String(data)
}

async function readHtmlFromInterface(
  client: ScClient,
  iface: ScAddr,
  nrelHtml: ScAddr,
): Promise<string | null> {
  const templ = new ScTemplate()
  templ.quintuple(
    iface,
    ScType.VarCommonArc,
    [ScType.VarNodeLink, '_html'],
    ScType.VarPermPosArc,
    nrelHtml,
  )
  const rows = await client.searchByTemplate(templ)
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const html = await readLinkString(client, rows[i].get('_html'))
    if (html.trim()) {
      return html
    }
  }
  return null
}

async function initiateTranslateAction(
  client: ScClient,
  iface: ScAddr,
  kn: PreviewKeynodes,
): Promise<void> {
  const build = new ScConstruction()
  build.generateNode(ScType.ConstNode, 'action')
  build.generateConnector(ScType.ConstPermPosArc, kn.actionClass, 'action')
  build.generateConnector(ScType.ConstPermPosArc, 'action', iface, 'arg_arc')
  build.generateConnector(ScType.ConstPermPosArc, kn.rrel1, 'arg_arc')

  const created = await client.generateElements(build)
  const action = created[build.getIndex('action')]
  if (!action?.isValid()) {
    throw new Error('error.translateActionCreate')
  }

  const waitDone = waitActionOutcome(
    client,
    action,
    kn.finishedOk,
    kn.finishedFail,
    PREVIEW_TIMEOUT_MS,
  )
  const initiate = new ScConstruction()
  initiate.generateConnector(
    ScType.ConstPermPosArc,
    kn.actionInitiated,
    action,
  )
  await client.generateElements(initiate)

  const outcome = await waitDone
  if (outcome === 'fail') {
    throw new Error('error.translateAgentFailed')
  }
}

export async function translateInterfaceToHtml(
  modelId: string,
  client?: ScClient,
): Promise<string> {
  const sc = client ?? (await connectSc())
  const kn = await resolvePreviewKeynodes(sc)
  const iface = await resolveInterfaceNode(sc, modelId)
  await initiateTranslateAction(sc, iface, kn)

  const html = await readHtmlFromInterface(sc, iface, kn.nrelHtml)
  if (!html) {
    throw new Error('error.htmlMissing')
  }
  return html
}

export function openHtmlPreview(html: string, target: Window): void {
  const url = URL.createObjectURL(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
  )
  target.location.href = url
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
