import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExportFormat, ExportScope } from '../export'
import { useDismissible } from './useDismissible'

type ExportMenuProps = {
  disabled: boolean
  canExportCurrent: boolean
  canExportAll: boolean
  busy: boolean
  onExport: (scope: ExportScope, format: ExportFormat) => void
}

export function ExportMenu({
  disabled,
  canExportCurrent,
  canExportAll,
  busy,
  onExport,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ExportScope>('current')
  const [format, setFormat] = useState<ExportFormat>('scs')
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useDismissible(open, close, rootRef)

  useEffect(() => {
    if (!open) {
      return
    }
    setScope(canExportCurrent ? 'current' : 'all')
    setFormat('scs')
  }, [open, canExportCurrent])

  useEffect(() => {
    if (disabled || busy) {
      setOpen(false)
    }
  }, [disabled, busy])

  function confirm() {
    if (scope === 'current' && !canExportCurrent) {
      return
    }
    if (scope === 'all' && !canExportAll) {
      return
    }
    setOpen(false)
    onExport(scope, format)
  }

  return (
    <div className="toolbar-popover" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Экспорт
      </button>
      {open ? (
        <div
          className="toolbar-popover__panel toolbar-popover__panel--end"
          role="dialog"
          aria-label="Экспорт"
        >
          <label className="toolbar-popover__field">
            <span>что</span>
            <select
              value={scope}
              disabled={busy}
              onChange={(e) => setScope(e.target.value as ExportScope)}
            >
              <option value="current" disabled={!canExportCurrent}>
                выбранный интерфейс
              </option>
              <option value="all" disabled={!canExportAll}>
                все интерфейсы
              </option>
            </select>
          </label>
          <label className="toolbar-popover__field">
            <span>формат</span>
            <select
              value={format}
              disabled={busy}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="scs">scs</option>
            </select>
          </label>
          <div className="toolbar-popover__actions">
            <button
              type="button"
              onClick={confirm}
              disabled={
                busy ||
                (scope === 'current' ? !canExportCurrent : !canExportAll)
              }
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
