import type { PropKey } from '../model/types'

export type FieldKind = 'text' | 'number' | 'checkbox' | 'select'

export type FieldSpec = {
  key: PropKey
  label: string
  kind: FieldKind
  options?: { value: string; label: string }[]
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
  { key: 'margin', label: 'внешний отступ', kind: 'number' },
  { key: 'tooltip', label: 'подсказка', kind: 'text' },
  { key: 'backgroundColor', label: 'цвет фона', kind: 'text' },
  { key: 'color', label: 'цвет текста', kind: 'text' },
  { key: 'borderColor', label: 'цвет рамки', kind: 'text' },
  { key: 'borderWidth', label: 'толщина рамки', kind: 'number' },
  {
    key: 'borderStyle',
    label: 'стиль рамки',
    kind: 'select',
    options: [
      { value: 'solid', label: 'solid' },
      { value: 'dashed', label: 'dashed' },
      { value: 'none', label: 'none' },
    ],
  },
  { key: 'borderRadius', label: 'скругление', kind: 'number' },
  { key: 'fontSize', label: 'размер шрифта', kind: 'number' },
  {
    key: 'fontWeight',
    label: 'начертание',
    kind: 'select',
    options: [
      { value: 'normal', label: 'обычный' },
      { value: 'bold', label: 'жирный' },
    ],
  },
  {
    key: 'textAlign',
    label: 'выравнивание текста',
    kind: 'select',
    options: [
      { value: 'left', label: 'слева' },
      { value: 'center', label: 'по центру' },
      { value: 'right', label: 'справа' },
    ],
  },
  { key: 'padding', label: 'внутренний отступ', kind: 'number' },
  { key: 'flexGrow', label: 'flexGrow', kind: 'number' },
  { key: 'flexShrink', label: 'flexShrink', kind: 'number' },
  {
    key: 'alignSelf',
    label: 'alignSelf',
    kind: 'select',
    options: [
      { value: 'auto', label: 'auto' },
      { value: 'flex-start', label: 'flex-start' },
      { value: 'center', label: 'center' },
      { value: 'flex-end', label: 'flex-end' },
      { value: 'stretch', label: 'stretch' },
    ],
  },
  { key: 'minWidth', label: 'min ширина', kind: 'number' },
  { key: 'minHeight', label: 'min высота', kind: 'number' },
  { key: 'maxWidth', label: 'max ширина', kind: 'number' },
  { key: 'maxHeight', label: 'max высота', kind: 'number' },
  { key: 'text', label: 'текст', kind: 'text' },
  { key: 'placeholder', label: 'placeholder', kind: 'text' },
  { key: 'readOnly', label: 'только чтение', kind: 'checkbox' },
  { key: 'semanticRole', label: 'семантическая роль', kind: 'text' },
  { key: 'actionId', label: 'действие', kind: 'text' },
]
