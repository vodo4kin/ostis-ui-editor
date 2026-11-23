import type { ComponentTypeId, LinkKindId } from './types'

export const ACTION_LINK_SOURCES: readonly ComponentTypeId[] = [
  'button',
  'select',
  'menu_item',
]

export const INPUT_TARGET_TYPES: readonly ComponentTypeId[] = [
  'text_field',
  'text_area',
  'select',
  'slider',
]

export const OUTPUT_TARGET_TYPES: readonly ComponentTypeId[] = [
  'text',
  'text_field',
  'text_area',
  'image',
  'sound',
  'list',
  'menu',
  'menu_bar',
  'menu_item',
  'select',
  'slider',
  'window',
  'scroll',
]

export function isActionLinkSource(typeId: ComponentTypeId): boolean {
  return ACTION_LINK_SOURCES.includes(typeId)
}

export function canLink(
  kind: LinkKindId,
  sourceType: ComponentTypeId,
  targetType: ComponentTypeId,
): boolean {
  if (kind === 'contains') {
    return true
  }
  if (!isActionLinkSource(sourceType)) {
    return false
  }
  if (kind === 'input_target') {
    return INPUT_TARGET_TYPES.includes(targetType)
  }
  if (kind === 'output_target') {
    return OUTPUT_TARGET_TYPES.includes(targetType)
  }
  return false
}

export function linkKindsForSource(
  typeId: ComponentTypeId,
): LinkKindId[] {
  if (isActionLinkSource(typeId)) {
    return ['contains', 'input_target', 'output_target']
  }
  return ['contains']
}
