import { useState } from 'react'

type RequestKind = 'change' | 'add' | 'question'

export function ChatPanel() {
  const [domain, setDomain] = useState('')
  const [users, setUsers] = useState('')
  const [kind, setKind] = useState<RequestKind>('change')
  const [text, setText] = useState('')

  return (
    <section className="editor-stack-panel editor-stack-panel--chat">
      <div className="panel-head">Чат</div>
      <div className="panel-body chat-body">
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
        <label className="chat-field chat-field--grow">
          <span>текст запроса</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </label>
        <button type="button" className="chat-send" disabled>
          Отправить
        </button>
      </div>
    </section>
  )
}
