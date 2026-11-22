import { useEffect, useRef, useState } from 'react'
import type { ExportFormat, ExportScope } from '../export'
import { resolveMessage, useLocale } from '../i18n'
import {
  LIMITS,
  formatCharCount,
  interfaceTitlesEqual,
  nextCopyInterfaceTitle,
  validateInterfaceTitle,
} from '../model/limits'
import { DEFAULT_INTERFACE_TITLE } from '../model/constants'
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
  htmlTranslatorAvailable: boolean
  canPreview: boolean
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
  onPreview: () => void
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
  htmlTranslatorAvailable,
  canPreview,
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
  onPreview,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onReconnect,
  onDialogOpenChange,
}: ToolbarProps) {
  const { locale, toggleLocale, t } = useLocale()
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
    setDraftName(DEFAULT_INTERFACE_TITLE)
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
      setNameError(resolveMessage(error))
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

  const statusRaw = scMessage ?? (!scConnected ? 'status.noConnection' : '')
  const statusText = resolveMessage(statusRaw)
  const dialogOpen = dialog !== 'none'
  const langButtonLabel = locale === 'en' ? 'RU' : 'EN'

  return (
    <header className="editor-toolbar">
      <span className="editor-toolbar__title">{t('toolbar.appTitle')}</span>

      <label className="editor-toolbar__iface">
        <span>{t('toolbar.interface')}</span>
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
          <span>{t('toolbar.name')}</span>
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
            {t('toolbar.ok')}
          </button>
          <button type="button" onClick={cancelDialog} disabled={scBusy}>
            {t('toolbar.cancel')}
          </button>
        </div>
      ) : (
        <>
          <button type="button" onClick={openCreate} disabled={!canCreate}>
            {t('toolbar.new')}
          </button>
          <button type="button" onClick={openRename} disabled={!canRename}>
            {t('toolbar.rename')}
          </button>
          <button
            type="button"
            onClick={openDuplicate}
            disabled={!canDuplicate}
          >
            {t('toolbar.duplicate')}
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
        {t('toolbar.save')}
      </button>

      <span className="editor-toolbar__gap" />

      <button
        type="button"
        onClick={onCopy}
        disabled={!canCopy || dialogOpen}
      >
        {t('toolbar.copy')}
      </button>
      <button
        type="button"
        onClick={onPaste}
        disabled={!canPaste || dialogOpen}
      >
        {t('toolbar.paste')}
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || dialogOpen}
        title="Ctrl+Z"
      >
        {t('toolbar.undo')}
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo || dialogOpen}
        title="Ctrl+Shift+Z"
      >
        {t('toolbar.redo')}
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
        <button
          type="button"
          className="editor-toolbar__lang"
          onClick={() => toggleLocale()}
          title={t('toolbar.langTitle')}
          aria-label={t('toolbar.langTitle')}
        >
          {langButtonLabel}
        </button>

        {!scConnected ? (
          <button
            type="button"
            className="editor-toolbar__reconnect"
            onClick={onReconnect}
            disabled={scBusy || dialogOpen}
          >
            {t('toolbar.reconnect')}
          </button>
        ) : null}

        <ExportMenu
          disabled={!canExport || dialogOpen}
          canExportCurrent={canExportCurrent}
          canExportAll={canExportAll}
          htmlAvailable={htmlTranslatorAvailable}
          busy={scBusy}
          onExport={onExport}
        />

        {htmlTranslatorAvailable ? (
          <button
            type="button"
            className="editor-toolbar__preview"
            onClick={onPreview}
            disabled={!canPreview || dialogOpen}
            title={t('toolbar.previewTitle')}
          >
            {t('toolbar.preview')}
          </button>
        ) : null}
      </div>
    </header>
  )
}
