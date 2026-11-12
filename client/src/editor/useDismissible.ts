import { useEffect, type RefObject } from 'react'

export function useDismissible(
  open: boolean,
  onClose: () => void,
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current
      if (!root || !(event.target instanceof Node)) {
        return
      }
      if (!root.contains(event.target)) {
        onClose()
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open, onClose, rootRef])
}
