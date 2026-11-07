import { CORE_PROPS } from './propSets'
import type {
  CatalogEntry,
  ComponentProps,
  ComponentTypeId,
  LinkKindId,
  PreviewShape,
  PropKey,
} from './types'

function baseProps(
  partial: Partial<ComponentProps> & Pick<ComponentProps, 'name' | 'width' | 'height'>,
): ComponentProps {
  return {
    name: partial.name,
    x: partial.x ?? 24,
    y: partial.y ?? 24,
    width: partial.width,
    height: partial.height,
    order: partial.order ?? 1,
    visible: partial.visible ?? true,
    enabled: partial.enabled ?? true,
    opacity: partial.opacity ?? 1,
    text: partial.text ?? '',
    tooltip: partial.tooltip ?? '',
    actionId: partial.actionId ?? '',
    backgroundColor: partial.backgroundColor ?? '#f4f4f4',
    color: partial.color ?? '#1a1a1a',
    borderColor: partial.borderColor ?? '#6f6f6f',
    borderWidth: partial.borderWidth ?? 1,
    borderStyle: partial.borderStyle ?? 'solid',
    fontSize: partial.fontSize ?? 13,
    fontWeight: partial.fontWeight ?? 'normal',
    textAlign: partial.textAlign ?? 'left',
    padding: partial.padding ?? 0,
    margin: partial.margin ?? 0,
    minWidth: partial.minWidth ?? 0,
    minHeight: partial.minHeight ?? 0,
    maxWidth: partial.maxWidth ?? 0,
    maxHeight: partial.maxHeight ?? 0,
  }
}

function entry(
  typeId: ComponentTypeId,
  label: string,
  preview: PreviewShape,
  defaults: ComponentProps,
): CatalogEntry {
  return {
    typeId,
    label,
    preview,
    allowedProps: [...CORE_PROPS],
    defaults,
  }
}

export const COMPONENT_CATALOG: CatalogEntry[] = [
  entry(
    'image',
    'Изображение',
    'rect',
    baseProps({
      name: 'Изображение',
      width: 160,
      height: 120,
      backgroundColor: '#e4e4e4',
      borderStyle: 'dashed',
      textAlign: 'center',
    }),
  ),
  entry(
    'sound',
    'Звук',
    'rect',
    baseProps({
      name: 'Звук',
      width: 160,
      height: 40,
      backgroundColor: '#e8e8e8',
      textAlign: 'center',
    }),
  ),
  entry(
    'text',
    'Текст',
    'rect',
    baseProps({
      name: 'Текст',
      width: 200,
      height: 36,
      backgroundColor: 'transparent',
      borderStyle: 'none',
      borderWidth: 0,
      text: 'Текст',
    }),
  ),
  entry(
    'divider',
    'Разделитель',
    'rect',
    baseProps({
      name: 'Разделитель',
      width: 280,
      height: 10,
      backgroundColor: '#b0b0b0',
      borderWidth: 0,
      borderStyle: 'none',
    }),
  ),
  entry(
    'spacer',
    'Пустое пространство',
    'rect',
    baseProps({
      name: 'Пустое пространство',
      width: 80,
      height: 80,
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
      borderColor: '#b8b8b8',
    }),
  ),
  entry(
    'menu',
    'Меню',
    'rect',
    baseProps({
      name: 'Меню',
      width: 180,
      height: 160,
      backgroundColor: '#f0f0f0',
      padding: 4,
    }),
  ),
  entry(
    'menu_bar',
    'Строка меню',
    'rect',
    baseProps({
      name: 'Строка меню',
      width: 320,
      height: 32,
      backgroundColor: '#ececec',
      padding: 2,
    }),
  ),
  entry(
    'list',
    'Список',
    'rect',
    baseProps({
      name: 'Список',
      width: 220,
      height: 130,
      backgroundColor: '#ffffff',
    }),
  ),
  entry(
    'scroll',
    'Панель прокрутки',
    'rect',
    baseProps({
      name: 'Панель прокрутки',
      width: 240,
      height: 160,
      backgroundColor: '#f2f2f2',
      padding: 4,
    }),
  ),
  entry(
    'window',
    'Окно',
    'rect',
    baseProps({
      name: 'Окно',
      width: 320,
      height: 200,
      backgroundColor: '#ffffff',
      padding: 8,
      text: 'Окно',
    }),
  ),
  entry(
    'text_field',
    'Однострочное поле',
    'rounded',
    baseProps({
      name: 'Однострочное поле',
      width: 240,
      height: 36,
      backgroundColor: '#ffffff',
    }),
  ),
  entry(
    'text_area',
    'Многострочное поле',
    'rounded',
    baseProps({
      name: 'Многострочное поле',
      width: 240,
      height: 100,
      backgroundColor: '#ffffff',
      padding: 4,
    }),
  ),
  entry(
    'slider',
    'Ползунок',
    'rect',
    baseProps({
      name: 'Ползунок',
      width: 200,
      height: 28,
      backgroundColor: '#e6e6e6',
      borderStyle: 'none',
      borderWidth: 0,
      text: '0',
      textAlign: 'center',
    }),
  ),
  entry(
    'select',
    'Выбор',
    'rounded',
    baseProps({
      name: 'Выбор',
      width: 200,
      height: 36,
      backgroundColor: '#ffffff',
      text: 'Вариант',
    }),
  ),
  entry(
    'button',
    'Кнопка',
    'rounded',
    baseProps({
      name: 'Кнопка',
      width: 120,
      height: 36,
      backgroundColor: '#e0e0e0',
      text: 'Кнопка',
      textAlign: 'center',
      fontWeight: 'bold',
    }),
  ),
  entry(
    'menu_item',
    'Пункт меню',
    'rect',
    baseProps({
      name: 'Пункт меню',
      width: 160,
      height: 28,
      backgroundColor: 'transparent',
      borderStyle: 'none',
      borderWidth: 0,
      text: 'Пункт',
      padding: 4,
    }),
  ),
]

export const LINK_KINDS: { id: LinkKindId; label: string }[] = [
  { id: 'contains', label: 'Вложение' },
]

const byId = new Map(COMPONENT_CATALOG.map((e) => [e.typeId, e]))

export function getCatalogEntry(typeId: ComponentTypeId): CatalogEntry {
  const entryItem = byId.get(typeId)
  if (!entryItem) {
    throw new Error(`Unknown component type: ${typeId}`)
  }
  return entryItem
}

export function labelOfType(typeId: ComponentTypeId): string {
  return getCatalogEntry(typeId).label
}

export function isPropAllowed(typeId: ComponentTypeId, key: PropKey): boolean {
  return getCatalogEntry(typeId).allowedProps.includes(key)
}
