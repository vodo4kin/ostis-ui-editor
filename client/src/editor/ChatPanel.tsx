import { useEffect, useMemo, useRef, useState } from 'react'
import { hasMessage, useT, type MessageKey } from '../i18n'
import { DialogClient } from '../sc/dialogClient'
import type { DialogMessage } from '../sc/dialogTypes'
import { getScClient } from '../sc'
import { PanelHeadLabel } from './PanelHeadLabel'

const SUGGESTION_KEYS = [
  'chat.suggest.types',
  'chat.suggest.actionId',
  'chat.suggest.buttonVsItem',
  'chat.suggest.principle',
] as const

function localId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function errorText(
  error: unknown,
  t: (key: MessageKey) => string,
): string {
  if (error instanceof Error && error.message) {
    if (hasMessage(error.message)) {
      return t(error.message)
    }
    return error.message
  }
  return String(error)
}

function formatElapsed(ms: number, decimalSep: string, unit: string): string {
  const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0
  const seconds = Math.floor(safe / 1000)
  const tenths = Math.floor((safe % 1000) / 100)
  return `${seconds}${decimalSep}${tenths} ${unit}`
}

export function ChatPanel() {
  const t = useT()
  const [collapsed, setCollapsed] = useState(false)
  const [messages, setMessages] = useState<DialogMessage[]>([])
  const [dialogId, setDialogId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [initError, setInitError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => performance.now())
  const threadRef = useRef<HTMLDivElement>(null)
  const pendingIdRef = useRef<string | null>(null)
  pendingIdRef.current = pendingId

  const client = useMemo(() => {
    const timeoutS = Number(
      import.meta.env.VITE_DIALOG_CLIENT_TIMEOUT_S ?? 30,
    )
    return new DialogClient(getScClient(), {
      timeoutMs: (Number.isFinite(timeoutS) ? timeoutS : 30) * 1000,
    })
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const id = await client.ensureDialog()
        if (!alive) {
          return
        }
        setDialogId(id)
        const history = await client.history(id)
        if (!alive) {
          return
        }
        setMessages(history)
        setInitError(null)
      } catch (err) {
        if (!alive) {
          return
        }
        setInitError(errorText(err, t) || t('chat.connectError'))
      }
    })()
    return () => {
      alive = false
    }
  }, [client, t])

  useEffect(() => {
    const thread = threadRef.current
    if (!thread) {
      return
    }
    thread.scrollTop = thread.scrollHeight
  }, [messages, pendingId])

  useEffect(() => {
    if (startedAt === null) {
      return
    }
    const timer = window.setInterval(() => {
      setNow(performance.now())
    }, 100)
    return () => window.clearInterval(timer)
  }, [startedAt])

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || !dialogId || pendingIdRef.current) {
      return
    }

    const createdAt = new Date().toISOString()
    const localPendingId = localId('msg')
    const userMessage: DialogMessage = {
      id: localId('user'),
      role: 'user',
      text: trimmed,
      state: 'done',
      createdAt,
    }
    const pendingMessage: DialogMessage = {
      id: localPendingId,
      role: 'assistant',
      text: '',
      state: 'pending',
      createdAt,
    }

    setMessages((prev) => [...prev, userMessage, pendingMessage])
    setPendingId(localPendingId)
    const started = performance.now()
    setStartedAt(started)
    setNow(started)
    setText('')

    try {
      const answer = await client.ask(dialogId, trimmed)

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== localPendingId) {
            return msg
          }
          if (answer.state === 'cancelled') {
            return {
              ...msg,
              state: 'cancelled',
              text: answer.text || t('chat.cancelled'),
            }
          }
          return {
            ...answer,
            id: localPendingId,
            createdAt: msg.createdAt,
          }
        }),
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === localPendingId
            ? {
                ...msg,
                state: 'error',
                error: errorText(err, t),
              }
            : msg,
        ),
      )
    } finally {
      if (pendingIdRef.current === localPendingId) {
        setPendingId(null)
      }
      setStartedAt(null)
    }
  }

  function onSend() {
    void ask(text)
  }

  function onCancel() {
    const current = pendingId
    if (!current) {
      return
    }
    setPendingId(null)
    setStartedAt(null)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === current
          ? { ...msg, state: 'cancelled', text: msg.text || t('chat.cancelled') }
          : msg,
      ),
    )
    void client.cancel()
  }

  function onRetry(messageId: string) {
    const index = messages.findIndex((msg) => msg.id === messageId)
    if (index < 0) {
      return
    }
    let question = ''
    for (let i = index - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') {
        question = messages[i].text
        break
      }
    }
    if (question) {
      void ask(question)
    }
  }

  const busy = pendingId !== null
  const canSend = Boolean(dialogId) && !busy && text.trim().length > 0
  const elapsedMs = startedAt === null ? 0 : Math.max(0, now - startedAt)

  return (
    <section
      className={
        collapsed
          ? 'editor-stack-panel editor-stack-panel--chat editor-stack-panel--collapsed'
          : 'editor-stack-panel editor-stack-panel--chat'
      }
    >
      <button
        type="button"
        className="panel-head panel-head--toggle"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="panel-head__mark">{collapsed ? '▸' : '▾'}</span>
        <PanelHeadLabel text={t('chat.title')} />
      </button>
      {collapsed ? null : (
        <div className="panel-body chat-body">
          {busy ? (
            <div className="chat-meta" role="status">
              <span className="chat-meta__pending">
                {t('chat.waiting')}:{' '}
                {formatElapsed(
                  elapsedMs,
                  t('chat.elapsedSep'),
                  t('chat.elapsedUnit'),
                )}
                <button
                  type="button"
                  className="chat-meta__cancel"
                  onClick={onCancel}
                >
                  {t('chat.cancel')}
                </button>
              </span>
            </div>
          ) : null}
          {initError ? (
            <p className="chat-status chat-status--error">{initError}</p>
          ) : null}

          <div className="chat-thread" ref={threadRef}>
            {messages.length === 0 && !initError ? (
              <div className="chat-empty">
                <p className="chat-thread-empty">{t('chat.emptyHint')}</p>
                <ul className="chat-suggest-list">
                  {SUGGESTION_KEYS.map((key) => (
                    <li key={key}>
                      <button
                        type="button"
                        className="chat-suggest"
                        disabled={busy || !dialogId}
                        onClick={() => void ask(t(key))}
                      >
                        {t(key)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === 'user'
                      ? 'chat-msg chat-msg--user'
                      : 'chat-msg chat-msg--assistant'
                  }
                >
                  <div
                    className={
                      msg.state === 'error'
                        ? 'chat-bubble chat-bubble--error'
                        : msg.state === 'cancelled'
                          ? 'chat-bubble chat-bubble--muted'
                          : 'chat-bubble'
                    }
                  >
                    {msg.state === 'pending' && !msg.text
                      ? t('chat.pending')
                      : msg.text}
                    {msg.state === 'error' && msg.error ? (
                      <div className="chat-msg__error">{msg.error}</div>
                    ) : null}
                  </div>
                  {msg.role === 'assistant' &&
                  msg.state === 'done' &&
                  msg.sources &&
                  msg.sources.length > 0 ? (
                    <ul className="chat-sources">
                      {msg.sources.map((source) => (
                        <li key={source.idtf} className="chat-sources__item">
                          <span className="prop-id">{source.idtf}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="chat-msg__who">
                    {msg.role === 'user' ? t('chat.you') : t('chat.assistant')}
                    {msg.state === 'cancelled' ? (
                      <span>{t('chat.cancelled')}</span>
                    ) : null}
                    {msg.state === 'error' ? (
                      <button
                        type="button"
                        className="chat-msg__retry"
                        onClick={() => onRetry(msg.id)}
                        disabled={busy}
                      >
                        {t('chat.retry')}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="chat-compose">
            <label className="chat-field">
              <span>{t('chat.requestText')}</span>
              <textarea
                value={text}
                disabled={!dialogId || busy}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (canSend) {
                      onSend()
                    }
                  }
                }}
              />
            </label>
            <div className="chat-compose__actions">
              <button
                type="button"
                className="chat-send"
                disabled={!canSend}
                onClick={onSend}
              >
                {t('chat.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
