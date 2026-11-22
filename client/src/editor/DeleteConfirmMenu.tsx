import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
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
  const t = useT()
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
        {t('toolbar.delete')}
      </button>
      {open ? (
        <div
          className="toolbar-popover__panel"
          role="dialog"
          aria-label={t('delete.dialog')}
        >
          <p className="toolbar-popover__text">
            {t('delete.confirm', { title: interfaceTitle })}
          </p>
          <div className="toolbar-popover__actions">
            <button type="button" onClick={confirm} disabled={busy}>
              {t('toolbar.ok')}
            </button>
            <button type="button" onClick={close} disabled={busy}>
              {t('toolbar.cancel')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
