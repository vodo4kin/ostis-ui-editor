import { useEffect, useRef, useState } from 'react'
import type { ExportFormat, ExportScope } from '../export'
import {
  LIMITS,
  formatCharCount,
  interfaceTitlesEqual,
  nextCopyInterfaceTitle,
  validateInterfaceTitle,
} from '../model/limits'
import type { ScInterfaceRef } from '../sc'
import { DeleteConfirmMenu } from './DeleteConfirmMenu'
import { ExportMenu } from './ExportMenu'

function interfaceOptionLabel(
  item: ScInterfaceRef,
  all: ScInterfaceRef[],
): string {
  const duplicates = all.filter((other) =>
    interfaceTitlesEqual(other.title, item.title),
  )
  if (duplicates.length > 1) {
    return `${item.title} (${item.id})`
  }
  return item.title
}

type ToolbarProps = {
  interfaces: ScInterfaceRef[]
  activeInterfaceId: string
  activeInterfaceTitle: string
  canUndo: boolean
  canRedo: boolean
  canSave: boolean
  canCreate: boolean
  canRename: boolean
  canDuplicate: boolean
  canDelete: boolean
  canExport: boolean
  canExportCurrent: boolean
  canExportAll: boolean
  canSelect: boolean
  canCopy: boolean
  canPaste: boolean
  scConnected: boolean
  scBusy: boolean
  scMessage: string | null
  onSelectInterface: (id: string) => void
  onCreate: (title: string) => void
  onRename: (title: string) => void
  onDuplicate: (title: string) => void
  onDelete: () => void
  onExport: (scope: ExportScope, format: ExportFormat) => void
  onSave: () => void
  onCopy: () => void
  onPaste: () => void
  onUndo: () => void
  onRedo: () => void
  onReconnect: () => void
  onDialogOpenChange?: (open: boolean) => void
}

type DialogMode = 'none' | 'create' | 'rename' | 'duplicate'

export function Toolbar({
  interfaces,
  activeInterfaceId,
  activeInterfaceTitle,
  canUndo,
  canRedo,
  canSave,
  canCreate,
  canRename,
  canDuplicate,
  canDelete,
  canExport,
  canExportCurrent,
  canExportAll,
  canSelect,
  canCopy,
  canPaste,
  scConnected,
  scBusy,
  scMessage,
  onSelectInterface,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onSave,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onReconnect,
  onDialogOpenChange,
}: ToolbarProps) {
  const [dialog, setDialog] = useState<DialogMode>('none')
  const [draftName, setDraftName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const nameDialog =
    dialog === 'create' || dialog === 'rename' || dialog === 'duplicate'

  useEffect(() => {
    onDialogOpenChange?.(dialog !== 'none')
  }, [dialog, onDialogOpenChange])

  useEffect(() => {
    if (!nameDialog) {
      return
    }
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [nameDialog, dialog])

  useEffect(() => {
    if (dialog === 'create' && !canCreate) {
      setDialog('none')
      setDraftName('')
      setNameError(null)
    }
    if (dialog === 'rename' && !canRename) {
      setDialog('none')
      setDraftName('')
      setNameError(null)
    }
    if (dialog === 'duplicate' && !canDuplicate) {
      setDialog('none')
      setDraftName('')
      setNameError(null)
    }
  }, [canCreate, canRename, canDuplicate, dialog])

  function openCreate() {
    setDraftName('Новый интерфейс')
    setNameError(null)
    setDialog('create')
  }

  function openRename() {
    setDraftName(activeInterfaceTitle)
    setNameError(null)
    setDialog('rename')
  }

  function openDuplicate() {
    setDraftName(nextCopyInterfaceTitle(activeInterfaceTitle, interfaces))
    setNameError(null)
    setDialog('duplicate')
  }

  function cancelDialog() {
    setDialog('none')
    setDraftName('')
    setNameError(null)
  }

  function confirmNameDialog() {
    const mode = dialog
    const exceptId = mode === 'rename' ? activeInterfaceId : undefined
    const error = validateInterfaceTitle(draftName, interfaces, exceptId)
    if (error) {
      setNameError(error)
      nameRef.current?.focus()
      return
    }
    const name = draftName
    setDialog('none')
    setDraftName('')
    setNameError(null)
    if (mode === 'create') {
      onCreate(name)
    } else if (mode === 'rename') {
      onRename(name)
    } else if (mode === 'duplicate') {
      onDuplicate(name)
    }
  }

  const statusText = scMessage ?? (!scConnected ? 'Нет связи с БЗ' : '')
  const dialogOpen = dialog !== 'none'

  return (
    <header className="editor-toolbar">
      <span className="editor-toolbar__title">Редактор ПИ</span>

      <label className="editor-toolbar__iface">
        <span>Интерфейс</span>
        <select
          value={activeInterfaceId}
          disabled={!canSelect || dialogOpen}
          onChange={(e) => {
            const id = e.target.value
            if (id) {
              onSelectInterface(id)
            }
          }}
        >
          {interfaces.map((item) => (
            <option key={item.id} value={item.id}>
              {interfaceOptionLabel(item, interfaces)}
            </option>
          ))}
        </select>
      </label>

      {nameDialog ? (
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
                confirmNameDialog()
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
            onClick={confirmNameDialog}
            disabled={scBusy || !draftName.trim()}
          >
            OK
          </button>
          <button type="button" onClick={cancelDialog} disabled={scBusy}>
            Отмена
          </button>
        </div>
      ) : (
        <>
          <button type="button" onClick={openCreate} disabled={!canCreate}>
            Новый
          </button>
          <button type="button" onClick={openRename} disabled={!canRename}>
            Переименовать
          </button>
          <button
            type="button"
            onClick={openDuplicate}
            disabled={!canDuplicate}
          >
            Дублировать
          </button>
          <DeleteConfirmMenu
            disabled={!canDelete || dialogOpen}
            busy={scBusy}
            interfaceTitle={activeInterfaceTitle}
            onConfirm={onDelete}
          />
        </>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || dialogOpen}
      >
        Сохранить
      </button>

      <span className="editor-toolbar__gap" />

      <button
        type="button"
        onClick={onCopy}
        disabled={!canCopy || dialogOpen}
      >
        Копировать
      </button>
      <button
        type="button"
        onClick={onPaste}
        disabled={!canPaste || dialogOpen}
      >
        Вставить
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || dialogOpen}
        title="Ctrl+Z"
      >
        Отменить
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo || dialogOpen}
        title="Ctrl+Shift+Z"
      >
        Вернуть
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

      <div className="editor-toolbar__end">
        {!scConnected ? (
          <button
            type="button"
            className="editor-toolbar__reconnect"
            onClick={onReconnect}
            disabled={scBusy || dialogOpen}
          >
            Подключиться к БЗ
          </button>
        ) : null}

        <ExportMenu
          disabled={!canExport || dialogOpen}
          canExportCurrent={canExportCurrent}
          canExportAll={canExportAll}
          busy={scBusy}
          onExport={onExport}
        />

        <button
          type="button"
          className="editor-toolbar__preview"
          disabled
          title="Сохранение в БЗ, затем транслятор HTML (пока не подключён)"
        >
          Предпросмотр
        </button>
      </div>
    </header>
  )
}
