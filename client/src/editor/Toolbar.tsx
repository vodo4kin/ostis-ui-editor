import { useEffect, useRef, useState } from 'react'
import {
  LIMITS,
  formatCharCount,
  validateInterfaceTitle,
} from '../model/limits'
import type { ScInterfaceRef } from '../sc'

type ToolbarProps = {
  interfaces: ScInterfaceRef[]
  activeInterfaceId: string
  activeInterfaceTitle: string
  canUndo: boolean
  canSave: boolean
  canCreate: boolean
  canDelete: boolean
  canSelect: boolean
  canCopy: boolean
  canPaste: boolean
  scConnected: boolean
  scBusy: boolean
  scMessage: string | null
  onSelectInterface: (id: string) => void
  onCreate: (title: string) => void
  onDelete: () => void
  onSave: () => void
  onCopy: () => void
  onPaste: () => void
  onUndo: () => void
  onReconnect: () => void
}

type DialogMode = 'none' | 'create' | 'delete'

export function Toolbar({
  interfaces,
  activeInterfaceId,
  activeInterfaceTitle,
  canUndo,
  canSave,
  canCreate,
  canDelete,
  canSelect,
  canCopy,
  canPaste,
  scConnected,
  scBusy,
  scMessage,
  onSelectInterface,
  onCreate,
  onDelete,
  onSave,
  onCopy,
  onPaste,
  onUndo,
  onReconnect,
}: ToolbarProps) {
  const [dialog, setDialog] = useState<DialogMode>('none')
  const [draftName, setDraftName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dialog !== 'create') {
      return
    }
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [dialog])

  useEffect(() => {
    if (dialog === 'create' && !canCreate) {
      setDialog('none')
      setDraftName('')
      setNameError(null)
    }
    if (dialog === 'delete' && !canDelete) {
      setDialog('none')
    }
  }, [canCreate, canDelete, dialog])

  function openCreate() {
    setDraftName('Новый интерфейс')
    setNameError(null)
    setDialog('create')
  }

  function openDelete() {
    setDialog('delete')
  }

  function cancelDialog() {
    setDialog('none')
    setDraftName('')
    setNameError(null)
  }

  function confirmCreate() {
    const error = validateInterfaceTitle(draftName)
    if (error) {
      setNameError(error)
      nameRef.current?.focus()
      return
    }
    setDialog('none')
    setDraftName('')
    setNameError(null)
    onCreate(draftName)
  }

  function confirmDelete() {
    setDialog('none')
    onDelete()
  }

  const statusText = scMessage ?? (!scConnected ? 'Нет связи с БЗ' : '')

  return (
    <header className="editor-toolbar">
      <span className="editor-toolbar__title">Редактор ПИ</span>

      <label className="editor-toolbar__iface">
        <span>Интерфейс</span>
        <select
          value={activeInterfaceId}
          disabled={!canSelect || dialog !== 'none'}
          onChange={(e) => {
            const id = e.target.value
            if (id) {
              onSelectInterface(id)
            }
          }}
        >
          {interfaces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>

      {dialog === 'create' ? (
        <div className="editor-toolbar__create">
          <span>Имя</span>
          <input
            ref={nameRef}
            className="editor-toolbar__name-input"
            type="text"
            value={draftName}
            maxLength={LIMITS.interfaceTitle.maxLength}
            disabled={scBusy}
            onChange={(e) => {
              setDraftName(e.target.value)
              setNameError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmCreate()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                cancelDialog()
              }
            }}
          />
          <span className="char-count">
            {formatCharCount(draftName.length, LIMITS.interfaceTitle.maxLength)}
          </span>
          {nameError ? (
            <span className="editor-toolbar__field-error">{nameError}</span>
          ) : null}
          <button
            type="button"
            onClick={confirmCreate}
            disabled={scBusy || !draftName.trim()}
          >
            OK
          </button>
          <button type="button" onClick={cancelDialog} disabled={scBusy}>
            Отмена
          </button>
        </div>
      ) : null}

      {dialog === 'delete' ? (
        <div className="editor-toolbar__create">
          <span className="editor-toolbar__confirm">
            Удалить «{activeInterfaceTitle}»?
          </span>
          <button type="button" onClick={confirmDelete} disabled={scBusy}>
            OK
          </button>
          <button type="button" onClick={cancelDialog} disabled={scBusy}>
            Отмена
          </button>
        </div>
      ) : null}

      {dialog === 'none' ? (
        <>
          <button type="button" onClick={openCreate} disabled={!canCreate}>
            Новый
          </button>
          <button type="button" onClick={openDelete} disabled={!canDelete}>
            Удалить
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || dialog !== 'none'}
      >
        Сохранить
      </button>

      <span className="editor-toolbar__gap" />

      <button type="button" onClick={onCopy} disabled={!canCopy}>
        Копировать
      </button>
      <button type="button" onClick={onPaste} disabled={!canPaste}>
        Вставить
      </button>
      <button type="button" onClick={onUndo} disabled={!canUndo}>
        Отменить
      </button>

      <span
        className={
          statusText
            ? 'editor-toolbar__status'
            : 'editor-toolbar__status editor-toolbar__status--empty'
        }
        title={statusText || undefined}
      >
        {statusText}
      </span>

      {!scConnected ? (
        <button
          type="button"
          className="editor-toolbar__reconnect"
          onClick={onReconnect}
          disabled={scBusy}
        >
          Подключиться к БЗ
        </button>
      ) : null}

      <button
        type="button"
        className="editor-toolbar__preview"
        disabled
        title="Сохранение в БЗ, затем транслятор HTML (пока не подключён)"
      >
        Предпросмотр
      </button>
    </header>
  )
}
