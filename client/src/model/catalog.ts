import { t, type MessageKey } from '../i18n'
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
  preview: PreviewShape,
  defaults: ComponentProps,
): CatalogEntry {
  return {
    typeId,
    label: typeId,
    preview,
    allowedProps: [...CORE_PROPS],
    defaults,
  }
}

export const COMPONENT_CATALOG: CatalogEntry[] = [
  entry(
    'image',
    'rect',
    baseProps({
      name: 'Image',
      width: 160,
      height: 120,
      background_color: '#e4e4e4',
      border_style: 'dashed',
      text_align: 'center',
    }),
  ),
  entry(
    'sound',
    'rect',
    baseProps({
      name: 'Sound',
      width: 160,
      height: 40,
      background_color: '#e8e8e8',
      text_align: 'center',
    }),
  ),
  entry(
    'text',
    'rect',
    baseProps({
      name: 'Text',
      width: 200,
      height: 36,
      background_color: 'transparent',
      border_style: 'none',
      border_width: 0,
      text_value: 'Text',
    }),
  ),
  entry(
    'divider',
    'rect',
    baseProps({
      name: 'Divider',
      width: 280,
      height: 10,
      background_color: '#b0b0b0',
      border_width: 0,
      border_style: 'none',
    }),
  ),
  entry(
    'spacer',
    'rect',
    baseProps({
      name: 'Spacer',
      width: 80,
      height: 80,
      background_color: 'transparent',
      border_style: 'dashed',
      border_color: '#b8b8b8',
    }),
  ),
  entry(
    'menu',
    'rect',
    baseProps({
      name: 'Menu',
      width: 180,
      height: 160,
      background_color: '#f0f0f0',
      padding: 4,
    }),
  ),
  entry(
    'menu_bar',
    'rect',
    baseProps({
      name: 'Menu bar',
      width: 320,
      height: 32,
      background_color: '#ececec',
      padding: 2,
    }),
  ),
  entry(
    'list',
    'rect',
    baseProps({
      name: 'List',
      width: 220,
      height: 130,
      background_color: '#ffffff',
    }),
  ),
  entry(
    'scroll',
    'rect',
    baseProps({
      name: 'Scroll panel',
      width: 240,
      height: 160,
      background_color: '#f2f2f2',
      padding: 4,
    }),
  ),
  entry(
    'window',
    'rect',
    baseProps({
      name: 'Window',
      width: 320,
      height: 200,
      background_color: '#ffffff',
      padding: 8,
      text_value: 'Window',
    }),
  ),
  entry(
    'text_field',
    'rounded',
    baseProps({
      name: 'Text field',
      width: 240,
      height: 36,
      background_color: '#ffffff',
      corner_radius: 4,
    }),
  ),
  entry(
    'text_area',
    'rounded',
    baseProps({
      name: 'Text area',
      width: 240,
      height: 100,
      background_color: '#ffffff',
      padding: 4,
      corner_radius: 4,
    }),
  ),
  entry(
    'slider',
    'rect',
    baseProps({
      name: 'Slider',
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
    'rounded',
    baseProps({
      name: 'Select',
      width: 200,
      height: 36,
      background_color: '#ffffff',
      text_value: 'Option',
      corner_radius: 4,
    }),
  ),
  entry(
    'button',
    'rounded',
    baseProps({
      name: 'Button',
      width: 120,
      height: 36,
      background_color: '#e0e0e0',
      text_value: 'Button',
      text_align: 'center',
      font_weight: 'bold',
      corner_radius: 4,
    }),
  ),
  entry(
    'menu_item',
    'rect',
    baseProps({
      name: 'Menu item',
      width: 160,
      height: 28,
      background_color: 'transparent',
      border_style: 'none',
      border_width: 0,
      text_value: 'Item',
      padding: 4,
    }),
  ),
]

export const LINK_KINDS: { id: LinkKindId }[] = [{ id: 'contains' }]

const byId = new Map(COMPONENT_CATALOG.map((e) => [e.typeId, e]))

export function getCatalogEntry(typeId: ComponentTypeId): CatalogEntry {
  const entryItem = byId.get(typeId)
  if (!entryItem) {
    throw new Error(`Unknown component type: ${typeId}`)
  }
  return entryItem
}

export function typeLabelKey(typeId: ComponentTypeId): MessageKey {
  return `type.${typeId}` as MessageKey
}

export function typeTextKey(typeId: ComponentTypeId): MessageKey | null {
  if (typeId === 'select' || typeId === 'menu_item') {
    return `type.${typeId}.text` as MessageKey
  }
  return null
}

export function labelOfType(typeId: ComponentTypeId): string {
  return t(typeLabelKey(typeId))
}

export function localizedDefaults(typeId: ComponentTypeId): ComponentProps {
  const defaults = structuredClone(getCatalogEntry(typeId).defaults)
  const label = labelOfType(typeId)
  defaults.name = label
  if (typeId === 'slider') {
    return defaults
  }
  if (defaults.text_value) {
    const textKey = typeTextKey(typeId)
    defaults.text_value = textKey ? t(textKey) : label
  }
  return defaults
}

export function isPropAllowed(typeId: ComponentTypeId, key: PropKey): boolean {
  return getCatalogEntry(typeId).allowedProps.includes(key)
}

export function linkKindLabel(kind: LinkKindId): string {
  if (kind === 'contains') {
    return t('link.contains')
  }
  return kind
}
