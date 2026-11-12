import type { PropKey } from '../model/types'

export type FieldKind = 'text' | 'number' | 'checkbox' | 'select'

export type FieldSpec = {
  key: PropKey
  label: string
  kind: FieldKind
  options?: { value: string; label: string }[]
}

export type PropGroup = {
  id: string
  label: string
  keys: PropKey[]
}

export const FIELD_SPECS: FieldSpec[] = [
  { key: 'name', label: 'имя', kind: 'text' },
  { key: 'x', label: 'x', kind: 'number' },
  { key: 'y', label: 'y', kind: 'number' },
  { key: 'width', label: 'ширина', kind: 'number' },
  { key: 'height', label: 'высота', kind: 'number' },
  { key: 'order', label: 'порядок', kind: 'number' },
  { key: 'visible', label: 'видимость', kind: 'checkbox' },
  { key: 'enabled', label: 'доступность', kind: 'checkbox' },
  { key: 'opacity', label: 'прозрачность', kind: 'number' },
  { key: 'text_value', label: 'текст', kind: 'text' },
  { key: 'tooltip', label: 'подсказка', kind: 'text' },
  { key: 'action_id', label: 'действие', kind: 'text' },
  { key: 'background_color', label: 'цвет фона', kind: 'text' },
  { key: 'color', label: 'цвет текста', kind: 'text' },
  { key: 'border_color', label: 'цвет рамки', kind: 'text' },
  { key: 'border_width', label: 'толщина рамки', kind: 'number' },
  {
    key: 'border_style',
    label: 'стиль рамки',
    kind: 'select',
    options: [
      { value: 'solid', label: 'solid' },
      { value: 'dashed', label: 'dashed' },
      { value: 'none', label: 'none' },
    ],
  },
  { key: 'corner_radius', label: 'скругление углов', kind: 'number' },
  { key: 'font_size', label: 'размер шрифта', kind: 'number' },
  {
    key: 'font_weight',
    label: 'начертание',
    kind: 'select',
    options: [
      { value: 'normal', label: 'обычный' },
      { value: 'bold', label: 'жирный' },
    ],
  },
  {
    key: 'text_align',
    label: 'выравнивание текста',
    kind: 'select',
    options: [
      { value: 'left', label: 'слева' },
      { value: 'center', label: 'по центру' },
      { value: 'right', label: 'справа' },
    ],
  },
  { key: 'padding', label: 'внутренний отступ', kind: 'number' },
  { key: 'margin', label: 'внешний отступ', kind: 'number' },
  { key: 'min_width', label: 'min ширина', kind: 'number' },
  { key: 'min_height', label: 'min высота', kind: 'number' },
  { key: 'max_width', label: 'max ширина', kind: 'number' },
  { key: 'max_height', label: 'max высота', kind: 'number' },
]

export const PROP_GROUPS: PropGroup[] = [
  {
    id: 'main',
    label: 'Основное',
    keys: ['name', 'order', 'visible', 'enabled', 'opacity'],
  },
  {
    id: 'geometry',
    label: 'Геометрия',
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
    label: 'Текст',
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
    label: 'Оформление',
    keys: [
      'background_color',
      'border_color',
      'border_width',
      'border_style',
      'corner_radius',
    ],
  },
]
