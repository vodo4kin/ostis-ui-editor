import { useState } from 'react'

type RequestKind = 'change' | 'add' | 'question'
type ContextKind = '' | 'selected' | 'structure'

export function ChatPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [users, setUsers] = useState('')
  const [contextKind, setContextKind] = useState<ContextKind>('')
  const [kind, setKind] = useState<RequestKind>('change')
  const [text, setText] = useState('')

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
        Чат
      </button>
      {collapsed ? null : (
        <div className="panel-body chat-body">
          <div className="chat-thread">
            <p className="chat-thread-empty">Нет сообщений.</p>
          </div>

          <div className="chat-compose">
            <details
              className="chat-extra"
              open={extraOpen}
              onToggle={(e) => setExtraOpen(e.currentTarget.open)}
            >
              <summary>Дополнительно</summary>
              <div className="chat-extra__body">
                <label className="chat-field">
                  <span>предметная область</span>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="необязательно"
                  />
                </label>
                <label className="chat-field">
                  <span>конечные пользователи</span>
                  <input
                    type="text"
                    value={users}
                    onChange={(e) => setUsers(e.target.value)}
                    placeholder="необязательно"
                  />
                </label>
                <label className="chat-field">
                  <span>контекст</span>
                  <select
                    value={contextKind}
                    onChange={(e) =>
                      setContextKind(e.target.value as ContextKind)
                    }
                  >
                    <option value="">ничего</option>
                    <option value="selected">выделенное</option>
                    <option value="structure">вся структура</option>
                  </select>
                </label>
              </div>
            </details>

            <label className="chat-field">
              <span>тип запроса</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as RequestKind)}
              >
                <option value="change">изменение</option>
                <option value="add">добавление</option>
                <option value="question">вопрос по области</option>
              </select>
            </label>
            <label className="chat-field">
              <span>текст запроса</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
              />
            </label>
            <button type="button" className="chat-send" disabled>
              Отправить
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
