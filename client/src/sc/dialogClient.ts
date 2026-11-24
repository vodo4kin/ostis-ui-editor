import {
  ScAddr,
  ScClient,
  ScConstruction,
  ScEventSubscriptionParams,
  ScEventType,
  ScHelper,
  ScLinkContent,
  ScLinkContentType,
  ScTemplate,
  ScType,
} from 'ts-sc-client'
import type {
  DialogClientOptions,
  DialogMessage,
  DialogMessageState,
  DialogRole,
  DialogSourceRef,
} from './dialogTypes'

const ACTION_CLASS = 'action_answer_ui_development_question'
const POLL_MS = 400
const DEFAULT_TIMEOUT_MS = 30_000

const MESSAGE_STATES = new Set<DialogMessageState>([
  'pending',
  'done',
  'error',
  'cancelled',
])

function toState(value: string | null): DialogMessageState {
  if (value === 'streaming') {
    return 'pending'
  }
  return value && MESSAGE_STATES.has(value as DialogMessageState)
    ? (value as DialogMessageState)
    : 'done'
}

type Keynodes = {
  dialog: ScAddr
  userMessage: ScAddr
  assistantMessage: ScAddr
  action: ScAddr
  actionClass: ScAddr
  actionInitiated: ScAddr
  actionFinished: ScAddr
  rrel1: ScAddr
  rrel2: ScAddr
  nrelDialogMessage: ScAddr
  nrelValue: ScAddr
  nrelTime: ScAddr
  nrelState: ScAddr
  nrelSource: ScAddr
  nrelUiId: ScAddr
}

type ActiveRequest = {
  action: ScAddr | null
  cancelled: boolean
  wake?: () => void
}

function isStableDialogId(value: string): boolean {
  return /^dialog-[0-9a-f]{12}$/.test(value)
}

function newDialogId(): string {
  return `dialog-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
}

export class DialogClient {
  private readonly client: ScClient
  private readonly helper: ScHelper
  private readonly timeoutMs: number
  private keynodesCache: Keynodes | null = null
  private active: ActiveRequest | null = null
  private dialogId: string | null = null

  constructor(client: ScClient, options?: DialogClientOptions) {
    this.client = client
    this.helper = new ScHelper(client)
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async ensureDialog(preferredId?: string): Promise<string> {
    const k = await this.keynodes()
    const candidate = preferredId ?? this.dialogId
    if (candidate) {
      const existing = await this.findDialogById(candidate, k)
      if (existing) {
        this.dialogId = candidate
        return candidate
      }
    }

    const dialog = await this.createNode()
    await this.instantiate(k.dialog, dialog)
    const id = newDialogId()
    await this.relateNonRole(dialog, await this.createLink(id), k.nrelUiId)
    this.dialogId = id
    return id
  }

  async history(dialogId: string): Promise<DialogMessage[]> {
    const k = await this.keynodes()
    const dialog = await this.findDialogById(dialogId, k)
    if (!dialog) {
      return []
    }

    const template = new ScTemplate()
    template.quintuple(
      dialog,
      ScType.VarCommonArc,
      [ScType.VarNode, '_message'],
      ScType.VarPermPosArc,
      k.nrelDialogMessage,
    )
    const rows = await this.client.searchByTemplate(template)
    const messages = await Promise.all(
      rows.map(async (row) => {
        const message = row.get('_message')
        const ordinal = await this.ordinal(dialog, message)
        return { ordinal, message: await this.readMessage(message, k) }
      }),
    )
    messages.sort((a, b) => a.ordinal - b.ordinal)
    return messages.map((item) => item.message)
  }

  async ask(dialogId: string, question: string): Promise<DialogMessage> {
    if (this.active) {
      throw new Error('error.dialogBusy')
    }

    const k = await this.keynodes()
    const dialog = await this.findDialogById(dialogId, k)
    if (!dialog) {
      throw new Error('chat.connectError')
    }
    this.dialogId = dialogId

    const action = await this.createAction(k, dialog, question)
    const active: ActiveRequest = { action, cancelled: false }
    this.active = active

    try {
      const finished = await this.waitForFinish(action, active)
      if (active.cancelled) {
        return {
          id: String(action.value),
          role: 'assistant',
          text: '',
          state: 'cancelled',
          createdAt: new Date().toISOString(),
        }
      }
      if (!finished) {
        throw new Error('error.dialogTimeout')
      }

      const result = await this.helper.getResult(action)
      if (!result?.isValid()) {
        throw new Error('error.dialogNoResult')
      }

      const template = new ScTemplate()
      template.triple(result, ScType.VarPermPosArc, [
        ScType.Unknown,
        '_element',
      ])
      const rows = await this.client.searchByTemplate(template)
      let messageAddr: ScAddr | null = null
      for (const row of rows) {
        const element = row.get('_element')
        if (!element?.isValid()) {
          continue
        }
        const check = new ScTemplate()
        check.triple(k.assistantMessage, ScType.VarPermPosArc, element)
        if ((await this.client.searchByTemplate(check)).length > 0) {
          messageAddr = element
          break
        }
      }
      if (!messageAddr) {
        throw new Error('error.dialogNoResult')
      }

      const last = await this.readMessage(messageAddr, k)
      if (last.state === 'error') {
        return { ...last, error: last.text }
      }
      return last
    } finally {
      if (this.active === active) {
        this.active = null
      }
    }
  }

  async cancel(): Promise<void> {
    if (!this.active) {
      return
    }
    this.active.cancelled = true
    this.active.wake?.()
  }

  private async createAction(
    k: Keynodes,
    dialog: ScAddr,
    question: string,
  ): Promise<ScAddr> {
    const action = await this.createNode()
    await this.instantiate(k.action, action)
    await this.instantiate(k.actionClass, action)
    await this.relateRole(action, await this.createLink(question), k.rrel1)
    await this.relateRole(action, dialog, k.rrel2)

    const construction = new ScConstruction()
    construction.generateConnector(
      ScType.ConstPermPosArc,
      k.actionInitiated,
      action,
    )
    await this.client.generateElements(construction)
    return action
  }

  private async createNode(): Promise<ScAddr> {
    const construction = new ScConstruction()
    construction.generateNode(ScType.ConstNode, '_node')
    const [node] = await this.client.generateElements(construction)
    return node
  }

  private async createLink(text: string): Promise<ScAddr> {
    const construction = new ScConstruction()
    construction.generateLink(
      ScType.ConstNodeLink,
      new ScLinkContent(text, ScLinkContentType.String),
      '_link',
    )
    const [link] = await this.client.generateElements(construction)
    return link
  }

  private async instantiate(classAddr: ScAddr, node: ScAddr): Promise<void> {
    const construction = new ScConstruction()
    construction.generateConnector(ScType.ConstPermPosArc, classAddr, node)
    await this.client.generateElements(construction)
  }

  private async relateRole(
    source: ScAddr,
    target: ScAddr,
    relation: ScAddr,
  ): Promise<void> {
    const construction = new ScConstruction()
    construction.generateConnector(
      ScType.ConstPermPosArc,
      source,
      target,
      '_arc',
    )
    construction.generateConnector(ScType.ConstPermPosArc, relation, '_arc')
    await this.client.generateElements(construction)
  }

  private async relateNonRole(
    source: ScAddr,
    target: ScAddr,
    relation: ScAddr,
  ): Promise<void> {
    const construction = new ScConstruction()
    construction.generateConnector(
      ScType.ConstCommonArc,
      source,
      target,
      '_arc',
    )
    construction.generateConnector(ScType.ConstPermPosArc, relation, '_arc')
    await this.client.generateElements(construction)
  }

  private async waitForFinish(
    action: ScAddr,
    active: ActiveRequest,
  ): Promise<boolean> {
    const k = await this.keynodes()
    let settled = false

    return new Promise<boolean>((resolve) => {
      const finish = (result: boolean) => {
        if (settled) {
          return
        }
        settled = true
        clearInterval(timer)
        clearTimeout(timeout)
        active.wake = undefined
        void subscription.then((sub) =>
          this.client
            .destroyElementaryEventSubscriptions(sub.id)
            .catch(() => undefined),
        )
        resolve(result)
      }

      const check = async () => {
        if (settled) {
          return
        }
        if (active.cancelled) {
          finish(false)
          return
        }
        try {
          if (await this.isFinished(k, action)) {
            finish(true)
          }
        } catch {
          /* ignore */
        }
      }

      const subscription = this.client
        .createElementaryEventSubscriptions([
          new ScEventSubscriptionParams(
            action,
            ScEventType.AfterGenerateIncomingArc,
            () => {
              void check()
            },
          ),
        ])
        .then((items) => items[0])

      const timer = setInterval(() => void check(), POLL_MS)
      const timeout = setTimeout(() => finish(false), this.timeoutMs)
      active.wake = () => finish(false)
      void check()
    })
  }

  private async isFinished(k: Keynodes, action: ScAddr): Promise<boolean> {
    const template = new ScTemplate()
    template.triple(k.actionFinished, ScType.VarPermPosArc, action)
    return (await this.client.searchByTemplate(template)).length > 0
  }

  private async readMessage(
    message: ScAddr,
    k: Keynodes,
  ): Promise<DialogMessage> {
    const role = await this.role(message, k)
    const text = (await this.linkValue(message, k.nrelValue)) ?? ''
    const state = toState(await this.linkValue(message, k.nrelState))
    const createdAt = (await this.linkValue(message, k.nrelTime)) ?? ''

    return {
      id: String(message.value),
      role,
      text,
      state,
      createdAt,
      sources: await this.sources(message, k),
      error: state === 'error' ? text : undefined,
    }
  }

  private async role(message: ScAddr, k: Keynodes): Promise<DialogRole> {
    const template = new ScTemplate()
    template.triple(k.userMessage, ScType.VarPermPosArc, message)
    if ((await this.client.searchByTemplate(template)).length > 0) {
      return 'user'
    }
    return 'assistant'
  }

  private async ordinal(dialog: ScAddr, message: ScAddr): Promise<number> {
    const template = new ScTemplate()
    template.quintuple(
      dialog,
      ScType.VarCommonArc,
      message,
      ScType.VarPermPosArc,
      [ScType.VarNodeRole, '_rrel'],
    )
    const rows = await this.client.searchByTemplate(template)
    if (rows.length === 0) {
      return 0
    }
    const idtf = await this.helper.getSystemIdentifier(rows[0].get('_rrel'))
    const value = Number.parseInt(idtf?.split('_').pop() ?? '', 10)
    return Number.isFinite(value) ? value : 0
  }

  private async sources(
    message: ScAddr,
    k: Keynodes,
  ): Promise<DialogSourceRef[]> {
    const template = new ScTemplate()
    template.quintuple(
      message,
      ScType.VarCommonArc,
      [ScType.VarNode, '_source'],
      ScType.VarPermPosArc,
      k.nrelSource,
    )
    const rows = await this.client.searchByTemplate(template)
    const result: DialogSourceRef[] = []
    for (const row of rows) {
      const addr = row.get('_source')
      const idtf = await this.helper.getSystemIdentifier(addr)
      if (idtf) {
        result.push({ idtf })
      }
    }
    return result
  }

  private async linkValue(
    node: ScAddr,
    relation: ScAddr,
  ): Promise<string | null> {
    const template = new ScTemplate()
    template.quintuple(
      node,
      ScType.VarCommonArc,
      [ScType.VarNodeLink, '_link'],
      ScType.VarPermPosArc,
      relation,
    )
    const rows = await this.client.searchByTemplate(template)
    if (rows.length === 0) {
      return null
    }
    const contents = await this.client.getLinkContents([rows[0].get('_link')])
    const data = contents[0]?.data
    return data === undefined ? null : String(data)
  }

  private async findDialogById(
    id: string,
    k: Keynodes,
  ): Promise<ScAddr | null> {
    if (!isStableDialogId(id)) {
      return null
    }
    const groups = await this.client.searchLinksByContents([id])
    for (const link of groups.flat()) {
      const template = new ScTemplate()
      template.quintuple(
        [ScType.VarNode, '_dialog'],
        ScType.VarCommonArc,
        link,
        ScType.VarPermPosArc,
        k.nrelUiId,
      )
      const rows = await this.client.searchByTemplate(template)
      if (rows.length) {
        return rows[0].get('_dialog')
      }
    }
    return null
  }

  private async keynodes(): Promise<Keynodes> {
    if (this.keynodesCache) {
      return this.keynodesCache
    }

    const ids = [
      'concept_ui_dialog',
      'concept_ui_user_message',
      'concept_ui_assistant_message',
      'action',
      ACTION_CLASS,
      'action_initiated',
      'action_finished',
      'nrel_ui_dialog_message',
      'nrel_ui_value',
      'nrel_ui_message_time',
      'nrel_ui_message_state',
      'nrel_ui_answer_source',
      'nrel_ui_id',
      'rrel_1',
      'rrel_2',
    ] as const

    const searchOnly = new ScType()
    const resolved = await this.client.resolveKeynodes(
      ids.map((id) => ({ id, type: searchOnly })),
    )
    const missing = ids.filter((id) => !resolved[id]?.isValid())
    if (missing.length) {
      throw new Error('error.dialogSchemaMissing')
    }

    this.keynodesCache = {
      dialog: resolved.concept_ui_dialog,
      userMessage: resolved.concept_ui_user_message,
      assistantMessage: resolved.concept_ui_assistant_message,
      action: resolved.action,
      actionClass: resolved[ACTION_CLASS],
      actionInitiated: resolved.action_initiated,
      actionFinished: resolved.action_finished,
      rrel1: resolved.rrel_1,
      rrel2: resolved.rrel_2,
      nrelDialogMessage: resolved.nrel_ui_dialog_message,
      nrelValue: resolved.nrel_ui_value,
      nrelTime: resolved.nrel_ui_message_time,
      nrelState: resolved.nrel_ui_message_state,
      nrelSource: resolved.nrel_ui_answer_source,
      nrelUiId: resolved.nrel_ui_id,
    }
    return this.keynodesCache
  }
}
