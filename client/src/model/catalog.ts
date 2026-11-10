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
    text_value: partial.text_value ?? '',
    tooltip: partial.tooltip ?? '',
    action_id: partial.action_id ?? '',
    background_color: partial.background_color ?? '#f4f4f4',
    color: partial.color ?? '#1a1a1a',
    border_color: partial.border_color ?? '#6f6f6f',
    border_width: partial.border_width ?? 1,
    border_style: partial.border_style ?? 'solid',
    corner_radius: partial.corner_radius ?? 0,
    font_size: partial.font_size ?? 13,
    font_weight: partial.font_weight ?? 'normal',
    text_align: partial.text_align ?? 'left',
    padding: partial.padding ?? 0,
    margin: partial.margin ?? 0,
    min_width: partial.min_width ?? 0,
    min_height: partial.min_height ?? 0,
    max_width: partial.max_width ?? 0,
    max_height: partial.max_height ?? 0,
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
      background_color: '#e4e4e4',
      border_style: 'dashed',
      text_align: 'center',
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
      background_color: '#e8e8e8',
      text_align: 'center',
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
      background_color: 'transparent',
      border_style: 'none',
      border_width: 0,
      text_value: 'Текст',
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
      background_color: '#b0b0b0',
      border_width: 0,
      border_style: 'none',
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
      background_color: 'transparent',
      border_style: 'dashed',
      border_color: '#b8b8b8',
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
      background_color: '#f0f0f0',
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
      background_color: '#ececec',
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
      background_color: '#ffffff',
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
      background_color: '#f2f2f2',
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
      background_color: '#ffffff',
      padding: 8,
      text_value: 'Окно',
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
      background_color: '#ffffff',
      corner_radius: 4,
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
      background_color: '#ffffff',
      padding: 4,
      corner_radius: 4,
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
      background_color: '#e6e6e6',
      border_style: 'none',
      border_width: 0,
      text_value: '0',
      text_align: 'center',
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
      background_color: '#ffffff',
      text_value: 'Вариант',
      corner_radius: 4,
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
      background_color: '#e0e0e0',
      text_value: 'Кнопка',
      text_align: 'center',
      font_weight: 'bold',
      corner_radius: 4,
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
      background_color: 'transparent',
      border_style: 'none',
      border_width: 0,
      text_value: 'Пункт',
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
