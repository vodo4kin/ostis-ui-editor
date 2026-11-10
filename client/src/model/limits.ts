import type { ComponentProps, PropKey } from './types'

export const LIMITS = {
  interfaceTitle: {
    minLength: 1,
    maxLength: 40,
  },
  scContentMaxLength: 1000,
  stringPropMaxLength: {
    name: 80,
    text_value: 500,
    tooltip: 200,
    action_id: 64,
    background_color: 32,
    color: 32,
    border_color: 32,
  } satisfies Partial<Record<PropKey, number>>,
  stringPropDefaultMaxLength: 200,
  numberProp: {
    x: { min: 0, max: 20_000 },
    y: { min: 0, max: 20_000 },
    width: { min: 1, max: 20_000 },
    height: { min: 1, max: 20_000 },
    order: { min: 0, max: 10_000 },
    opacity: { min: 0, max: 1 },
    border_width: { min: 0, max: 64 },
    font_size: { min: 6, max: 256 },
    padding: { min: 0, max: 512 },
    margin: { min: 0, max: 512 },
    min_width: { min: 0, max: 20_000 },
    min_height: { min: 0, max: 20_000 },
    max_width: { min: 0, max: 20_000 },
    max_height: { min: 0, max: 20_000 },
  } satisfies Partial<Record<PropKey, { min: number; max: number }>>,
} as const

export function stringPropMaxLength(key: PropKey): number {
  const mapped = LIMITS.stringPropMaxLength[key as keyof typeof LIMITS.stringPropMaxLength]
  const cap = mapped ?? LIMITS.stringPropDefaultMaxLength
  return Math.min(cap, LIMITS.scContentMaxLength)
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

export function clampString(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }
  return value.slice(0, maxLength)
}

export function normalizeInterfaceTitle(raw: string): string {
  return clampString(raw.trim().replace(/\s+/g, ' '), LIMITS.interfaceTitle.maxLength)
}

export function validateInterfaceTitle(raw: string): string | null {
  const title = normalizeInterfaceTitle(raw)
  if (title.length < LIMITS.interfaceTitle.minLength) {
    return 'Укажите имя'
  }
  if (raw.trim().length > LIMITS.interfaceTitle.maxLength) {
    return `Не больше ${LIMITS.interfaceTitle.maxLength} символов`
  }
  return null
}

export function normalizePropValue<K extends PropKey>(
  key: K,
  value: ComponentProps[K],
): ComponentProps[K] {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    const range = LIMITS.numberProp[key as keyof typeof LIMITS.numberProp]
    if (!range) {
      return (Number.isFinite(value) ? value : 0) as ComponentProps[K]
    }
    return clampNumber(value, range.min, range.max) as ComponentProps[K]
  }
  if (typeof value === 'string') {
    return clampString(value, stringPropMaxLength(key)) as ComponentProps[K]
  }
  return value
}

export function normalizePropPatch(
  patch: Partial<ComponentProps>,
): Partial<ComponentProps> {
  const next: Partial<ComponentProps> = {}
  for (const key of Object.keys(patch) as PropKey[]) {
    const value = patch[key]
    if (value === undefined) {
      continue
    }
    ;(next as Record<string, unknown>)[key] = normalizePropValue(key, value as never)
  }
  return next
}

export function normalizeScContent(value: string): string {
  return clampString(value, LIMITS.scContentMaxLength)
}

export function formatCharCount(length: number, maxLength: number): string {
  return `${length}/${maxLength}`
}
