import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { PanelHeadLabel } from './PanelHeadLabel'

type RequestKind = 'change' | 'add' | 'question'
type ContextKind = '' | 'selected' | 'structure'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

let messageSeq = 1

function nextMessageId(): string {
  const id = `msg_${messageSeq}`
  messageSeq += 1
  return id
}

export function ChatPanel() {
  const t = useT()
  const [collapsed, setCollapsed] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [users, setUsers] = useState('')
  const [contextKind, setContextKind] = useState<ContextKind>('')
  const [kind, setKind] = useState<RequestKind>('change')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const thread = threadRef.current
    if (!thread) {
      return
    }
    thread.scrollTop = thread.scrollHeight
  }, [messages])

  function send() {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: 'user', text: trimmed },
      {
        id: nextMessageId(),
        role: 'assistant',
        text: t('chat.connectError'),
      },
    ])
    setText('')
  }

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
          <div className="chat-thread" ref={threadRef}>
            {messages.length === 0 ? (
              <p className="chat-thread-empty">{t('chat.empty')}</p>
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
                  <div className="chat-bubble">{msg.text}</div>
                  <div className="chat-msg__who">
                    {msg.role === 'user' ? t('chat.you') : t('chat.ai')}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-compose">
            <details
              className="chat-extra"
              open={extraOpen}
              onToggle={(e) => setExtraOpen(e.currentTarget.open)}
            >
              <summary>{t('chat.extra')}</summary>
              <div className="chat-extra__body">
                <label className="chat-field">
                  <span>{t('chat.domain')}</span>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder={t('chat.optional')}
                  />
                </label>
                <label className="chat-field">
                  <span>{t('chat.users')}</span>
                  <input
                    type="text"
                    value={users}
                    onChange={(e) => setUsers(e.target.value)}
                    placeholder={t('chat.optional')}
                  />
                </label>
                <label className="chat-field">
                  <span>{t('chat.context')}</span>
                  <select
                    value={contextKind}
                    onChange={(e) =>
                      setContextKind(e.target.value as ContextKind)
                    }
                  >
                    <option value="">{t('chat.context.none')}</option>
                    <option value="selected">{t('chat.context.selected')}</option>
                    <option value="structure">
                      {t('chat.context.structure')}
                    </option>
                  </select>
                </label>
              </div>
            </details>

            <label className="chat-field">
              <span>{t('chat.requestKind')}</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as RequestKind)}
              >
                <option value="change">{t('chat.request.change')}</option>
                <option value="add">{t('chat.request.add')}</option>
                <option value="question">{t('chat.request.question')}</option>
              </select>
            </label>
            <label className="chat-field">
              <span>{t('chat.requestText')}</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="chat-send"
              disabled={!text.trim()}
              onClick={send}
            >
              {t('chat.send')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
