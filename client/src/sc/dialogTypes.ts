export type DialogRole = 'user' | 'assistant'

export type DialogMessageState =
  | 'pending'
  | 'done'
  | 'error'
  | 'cancelled'

export type DialogSourceRef = {
  idtf: string
}

export type DialogMessage = {
  id: string
  role: DialogRole
  text: string
  state: DialogMessageState
  createdAt: string
  sources?: DialogSourceRef[]
  error?: string
}

export type DialogClientOptions = {
  timeoutMs?: number
}
