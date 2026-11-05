import type { PropKey } from './types'

export const BASE_PROPS: PropKey[] = [
  'name',
  'x',
  'y',
  'width',
  'height',
  'order',
  'visible',
  'enabled',
  'opacity',
  'margin',
  'tooltip',
]

export const APPEARANCE_PROPS: PropKey[] = [
  'backgroundColor',
  'color',
  'borderColor',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'fontSize',
  'fontWeight',
  'textAlign',
]

export const LAYOUT_PROPS: PropKey[] = [
  'padding',
  'flexGrow',
  'flexShrink',
  'alignSelf',
]

export const LIMIT_PROPS: PropKey[] = [
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
]

export const TEXT_PROPS: PropKey[] = ['text']
export const INPUT_PROPS: PropKey[] = ['text', 'placeholder', 'readOnly']
export const ROLE_PROPS: PropKey[] = ['semanticRole']
export const ACTION_PROPS: PropKey[] = ['actionId']

export const DIVIDER_EXTRA: PropKey[] = [
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'borderStyle',
]

export function mergeProps(...groups: PropKey[][]): PropKey[] {
  const set = new Set<PropKey>()
  for (const group of groups) {
    for (const key of group) {
      set.add(key)
    }
  }
  return [...set]
}
