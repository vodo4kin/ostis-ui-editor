export type ShortcutAction =
  | 'undo'
  | 'redo'
  | 'save'
  | 'exportCurrent'
  | 'selectAll'
  | 'duplicate'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'delete'
  | 'clearSelection'
  | 'nudgeLeft'
  | 'nudgeRight'
  | 'nudgeUp'
  | 'nudgeDown'
  | 'bringForward'
  | 'sendBackward'

type ShortcutSpec = {
  action: ShortcutAction
  code: string
  mod?: boolean
  shift?: boolean
  alt?: boolean
  ignoreShift?: boolean
}

const SPECS: ShortcutSpec[] = [
  { action: 'exportCurrent', code: 'KeyS', mod: true, shift: true },
  { action: 'redo', code: 'KeyZ', mod: true, shift: true },
  { action: 'redo', code: 'KeyY', mod: true },
  { action: 'undo', code: 'KeyZ', mod: true },
  { action: 'save', code: 'KeyS', mod: true },
  { action: 'selectAll', code: 'KeyA', mod: true },
  { action: 'duplicate', code: 'KeyD', mod: true },
  { action: 'cut', code: 'KeyX', mod: true },
  { action: 'copy', code: 'KeyC', mod: true },
  { action: 'paste', code: 'KeyV', mod: true },
  { action: 'bringForward', code: 'ArrowUp', alt: true },
  { action: 'sendBackward', code: 'ArrowDown', alt: true },
  { action: 'delete', code: 'Delete' },
  { action: 'delete', code: 'Backspace' },
  { action: 'clearSelection', code: 'Escape' },
  { action: 'nudgeLeft', code: 'ArrowLeft', ignoreShift: true },
  { action: 'nudgeRight', code: 'ArrowRight', ignoreShift: true },
  { action: 'nudgeUp', code: 'ArrowUp', ignoreShift: true },
  { action: 'nudgeDown', code: 'ArrowDown', ignoreShift: true },
]

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true
  }
  return target.isContentEditable
}

export function hasPrimaryMod(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey
}

export function matchShortcut(e: KeyboardEvent): ShortcutAction | null {
  const mod = hasPrimaryMod(e)
  const shift = e.shiftKey
  const alt = e.altKey

  for (const spec of SPECS) {
    if (e.code !== spec.code) {
      continue
    }
    if (Boolean(spec.mod) !== mod) {
      continue
    }
    if (!spec.ignoreShift && Boolean(spec.shift) !== shift) {
      continue
    }
    if (Boolean(spec.alt) !== alt) {
      continue
    }
    return spec.action
  }
  return null
}

export function nudgeStep(e: KeyboardEvent): number {
  return e.shiftKey ? 10 : 1
}
