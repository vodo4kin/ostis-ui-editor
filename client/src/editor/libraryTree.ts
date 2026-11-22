import type { MessageKey } from '../i18n'
import type { ComponentTypeId } from '../model/types'

export type LibraryNode = {
  id: string
  labelKey: MessageKey
  typeId?: ComponentTypeId
  children?: LibraryNode[]
}

export const LIBRARY_TREE: LibraryNode[] = [
  {
    id: 'output',
    labelKey: 'library.output',
    children: [
      { id: 'image', labelKey: 'type.image', typeId: 'image' },
      { id: 'sound', labelKey: 'type.sound', typeId: 'sound' },
      { id: 'text', labelKey: 'type.text', typeId: 'text' },
    ],
  },
  {
    id: 'decor',
    labelKey: 'library.decor',
    children: [
      { id: 'divider', labelKey: 'type.divider', typeId: 'divider' },
      { id: 'spacer', labelKey: 'type.spacer', typeId: 'spacer' },
    ],
  },
  {
    id: 'containers',
    labelKey: 'library.containers',
    children: [
      { id: 'menu', labelKey: 'type.menu', typeId: 'menu' },
      { id: 'menu_bar', labelKey: 'type.menu_bar', typeId: 'menu_bar' },
      { id: 'list', labelKey: 'type.list', typeId: 'list' },
      { id: 'scroll', labelKey: 'type.scroll', typeId: 'scroll' },
      { id: 'window', labelKey: 'type.window', typeId: 'window' },
    ],
  },
  {
    id: 'input',
    labelKey: 'library.input',
    children: [
      { id: 'text_field', labelKey: 'type.text_field', typeId: 'text_field' },
      { id: 'text_area', labelKey: 'type.text_area', typeId: 'text_area' },
      { id: 'slider', labelKey: 'type.slider', typeId: 'slider' },
      { id: 'select', labelKey: 'type.select', typeId: 'select' },
    ],
  },
  {
    id: 'actions',
    labelKey: 'library.actions',
    children: [
      { id: 'button', labelKey: 'type.button', typeId: 'button' },
      { id: 'menu_item', labelKey: 'type.menu_item', typeId: 'menu_item' },
    ],
  },
]
