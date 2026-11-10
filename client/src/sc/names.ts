import type { ComponentTypeId, PropKey } from '../model/types'
import { CORE_PROPS } from '../model/propSets'

export const REL = {
  contains: 'nrel_ui_contains',
  has_component: 'nrel_ui_has_component',
  id: 'nrel_ui_id',
  value: 'nrel_ui_value',
} as const

export const CLASS_INTERFACE = 'concept_ui_interface'

export const TYPE_TO_CLASS: Record<ComponentTypeId, string> = {
  image: 'concept_ui_image',
  sound: 'concept_ui_sound',
  text: 'concept_ui_text',
  divider: 'concept_ui_divider',
  spacer: 'concept_ui_spacer',
  menu: 'concept_ui_menu',
  menu_bar: 'concept_ui_menu_bar',
  list: 'concept_ui_list',
  scroll: 'concept_ui_scroll',
  window: 'concept_ui_window',
  text_field: 'concept_ui_text_field',
  text_area: 'concept_ui_text_area',
  slider: 'concept_ui_slider',
  select: 'concept_ui_select',
  button: 'concept_ui_button',
  menu_item: 'concept_ui_menu_item',
}

export const CLASS_TO_TYPE: Record<string, ComponentTypeId> = Object.fromEntries(
  Object.entries(TYPE_TO_CLASS).map(([typeId, className]) => [className, typeId]),
) as Record<string, ComponentTypeId>

export const PROP_TO_CLASS: Record<PropKey, string> = {
  name: 'concept_ui_name',
  x: 'concept_ui_x',
  y: 'concept_ui_y',
  width: 'concept_ui_width',
  height: 'concept_ui_height',
  order: 'concept_ui_order',
  visible: 'concept_ui_visible',
  enabled: 'concept_ui_enabled',
  opacity: 'concept_ui_opacity',
  text_value: 'concept_ui_text_value',
  tooltip: 'concept_ui_tooltip',
  action_id: 'concept_ui_action_id',
  background_color: 'concept_ui_background_color',
  color: 'concept_ui_color',
  border_color: 'concept_ui_border_color',
  border_width: 'concept_ui_border_width',
  border_style: 'concept_ui_border_style',
  corner_radius: 'concept_ui_corner_radius',
  font_size: 'concept_ui_font_size',
  font_weight: 'concept_ui_font_weight',
  text_align: 'concept_ui_text_align',
  padding: 'concept_ui_padding',
  margin: 'concept_ui_margin',
  min_width: 'concept_ui_min_width',
  min_height: 'concept_ui_min_height',
  max_width: 'concept_ui_max_width',
  max_height: 'concept_ui_max_height',
}

export const CLASS_TO_PROP: Record<string, PropKey> = Object.fromEntries(
  Object.entries(PROP_TO_CLASS).map(([key, className]) => [className, key]),
) as Record<string, PropKey>

export const ALL_PROP_KEYS: PropKey[] = [...CORE_PROPS]
