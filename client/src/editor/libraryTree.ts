import type { ComponentTypeId } from '../model/types'

export type LibraryNode = {
  id: string
  label: string
  typeId?: ComponentTypeId
  children?: LibraryNode[]
}

export const LIBRARY_TREE: LibraryNode[] = [
  {
    id: 'output',
    label: 'Вывод',
    children: [
      { id: 'image', label: 'Изображение', typeId: 'image' },
      { id: 'sound', label: 'Звук', typeId: 'sound' },
      { id: 'text', label: 'Текст', typeId: 'text' },
    ],
  },
  {
    id: 'decor',
    label: 'Декор',
    children: [
      { id: 'divider', label: 'Разделитель', typeId: 'divider' },
      { id: 'spacer', label: 'Пустое пространство', typeId: 'spacer' },
    ],
  },
  {
    id: 'containers',
    label: 'Контейнеры',
    children: [
      { id: 'menu', label: 'Меню', typeId: 'menu' },
      { id: 'menu_bar', label: 'Строка меню', typeId: 'menu_bar' },
      { id: 'list', label: 'Список', typeId: 'list' },
      { id: 'scroll', label: 'Панель прокрутки', typeId: 'scroll' },
      { id: 'window', label: 'Окно', typeId: 'window' },
    ],
  },
  {
    id: 'input',
    label: 'Ввод',
    children: [
      { id: 'text_field', label: 'Однострочное поле', typeId: 'text_field' },
      { id: 'text_area', label: 'Многострочное поле', typeId: 'text_area' },
      { id: 'slider', label: 'Ползунок', typeId: 'slider' },
      { id: 'select', label: 'Выбор', typeId: 'select' },
    ],
  },
  {
    id: 'actions',
    label: 'Действия',
    children: [
      { id: 'button', label: 'Кнопка', typeId: 'button' },
      { id: 'menu_item', label: 'Пункт меню', typeId: 'menu_item' },
    ],
  },
]
