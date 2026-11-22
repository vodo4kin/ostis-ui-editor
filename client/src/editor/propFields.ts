import type { MessageKey } from '../i18n'
import type { PropKey } from '../model/types'

export type FieldKind = 'text' | 'number' | 'checkbox' | 'select'

export type FieldSpec = {
  key: PropKey
  labelKey: MessageKey
  kind: FieldKind
  options?: { value: string; labelKey?: MessageKey; label?: string }[]
}

export type PropGroup = {
  id: string
  labelKey: MessageKey
  keys: PropKey[]
}

export const FIELD_SPECS: FieldSpec[] = [
  { key: 'name', labelKey: 'prop.name', kind: 'text' },
  { key: 'x', labelKey: 'prop.x', kind: 'number' },
  { key: 'y', labelKey: 'prop.y', kind: 'number' },
  { key: 'width', labelKey: 'prop.width', kind: 'number' },
  { key: 'height', labelKey: 'prop.height', kind: 'number' },
  { key: 'order', labelKey: 'prop.order', kind: 'number' },
  { key: 'visible', labelKey: 'prop.visible', kind: 'checkbox' },
  { key: 'enabled', labelKey: 'prop.enabled', kind: 'checkbox' },
  { key: 'opacity', labelKey: 'prop.opacity', kind: 'number' },
  { key: 'text_value', labelKey: 'prop.text_value', kind: 'text' },
  { key: 'tooltip', labelKey: 'prop.tooltip', kind: 'text' },
  { key: 'action_id', labelKey: 'prop.action_id', kind: 'text' },
  { key: 'background_color', labelKey: 'prop.background_color', kind: 'text' },
  { key: 'color', labelKey: 'prop.color', kind: 'text' },
  { key: 'border_color', labelKey: 'prop.border_color', kind: 'text' },
  { key: 'border_width', labelKey: 'prop.border_width', kind: 'number' },
  {
    key: 'border_style',
    labelKey: 'prop.border_style',
    kind: 'select',
    options: [
      { value: 'solid', label: 'solid' },
      { value: 'dashed', label: 'dashed' },
      { value: 'none', label: 'none' },
    ],
  },
  { key: 'corner_radius', labelKey: 'prop.corner_radius', kind: 'number' },
  { key: 'font_size', labelKey: 'prop.font_size', kind: 'number' },
  {
    key: 'font_weight',
    labelKey: 'prop.font_weight',
    kind: 'select',
    options: [
      { value: 'normal', labelKey: 'prop.font_weight.normal' },
      { value: 'bold', labelKey: 'prop.font_weight.bold' },
    ],
  },
  {
    key: 'text_align',
    labelKey: 'prop.text_align',
    kind: 'select',
    options: [
      { value: 'left', labelKey: 'prop.text_align.left' },
      { value: 'center', labelKey: 'prop.text_align.center' },
      { value: 'right', labelKey: 'prop.text_align.right' },
    ],
  },
  { key: 'padding', labelKey: 'prop.padding', kind: 'number' },
  { key: 'margin', labelKey: 'prop.margin', kind: 'number' },
  { key: 'min_width', labelKey: 'prop.min_width', kind: 'number' },
  { key: 'min_height', labelKey: 'prop.min_height', kind: 'number' },
  { key: 'max_width', labelKey: 'prop.max_width', kind: 'number' },
  { key: 'max_height', labelKey: 'prop.max_height', kind: 'number' },
]

export const PROP_GROUPS: PropGroup[] = [
  {
    id: 'main',
    labelKey: 'propGroup.main',
    keys: ['name', 'order', 'visible', 'enabled', 'opacity'],
  },
  {
    id: 'geometry',
    labelKey: 'propGroup.geometry',
    keys: [
      'x',
      'y',
      'width',
      'height',
      'padding',
      'margin',
      'min_width',
      'min_height',
      'max_width',
      'max_height',
    ],
  },
  {
    id: 'text',
    labelKey: 'propGroup.text',
    keys: [
      'text_value',
      'tooltip',
      'action_id',
      'color',
      'font_size',
      'font_weight',
      'text_align',
    ],
  },
  {
    id: 'look',
    labelKey: 'propGroup.look',
    keys: [
      'background_color',
      'border_color',
      'border_width',
      'border_style',
      'corner_radius',
    ],
  },
]
