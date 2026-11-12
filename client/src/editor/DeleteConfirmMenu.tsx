import { useCallback, useEffect, useRef, useState } from 'react'
import { useDismissible } from './useDismissible'

type DeleteConfirmMenuProps = {
  disabled: boolean
  busy: boolean
  interfaceTitle: string
  onConfirm: () => void
}

export function DeleteConfirmMenu({
  disabled,
  busy,
  interfaceTitle,
  onConfirm,
}: DeleteConfirmMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useDismissible(open, close, rootRef)

  useEffect(() => {
    if (disabled || busy) {
      setOpen(false)
    }
  }, [disabled, busy])

  function confirm() {
    setOpen(false)
    onConfirm()
  }

  return (
    <div className="toolbar-popover" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Удалить
      </button>
      {open ? (
        <div
          className="toolbar-popover__panel"
          role="dialog"
          aria-label="Подтверждение удаления"
        >
          <p className="toolbar-popover__text">
            Вы точно желаете удалить «{interfaceTitle}»?
          </p>
          <div className="toolbar-popover__actions">
            <button type="button" onClick={confirm} disabled={busy}>
              OK
            </button>
            <button type="button" onClick={close} disabled={busy}>
              Отмена
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
