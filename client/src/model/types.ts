export type ComponentTypeId =
  | 'image'
  | 'sound'
  | 'text'
  | 'divider'
  | 'spacer'
  | 'menu'
  | 'menu_bar'
  | 'list'
  | 'scroll'
  | 'window'
  | 'text_field'
  | 'text_area'
  | 'slider'
  | 'select'
  | 'button'
  | 'menu_item'

export type LinkKindId = 'contains'

export type PreviewShape = 'rect' | 'rounded' | 'pill'

export type BorderStyle = 'solid' | 'dashed' | 'none'
export type FontWeight = 'normal' | 'bold'
export type TextAlign = 'left' | 'center' | 'right'

export type PropKey = keyof ComponentProps

/** Свойства компонента в модели интерфейса. */
export type ComponentProps = {
  name: string
  x: number
  y: number
  width: number
  height: number
  order: number
  visible: boolean
  enabled: boolean
  opacity: number
  text: string
  tooltip: string
  actionId: string
  backgroundColor: string
  color: string
  borderColor: string
  borderWidth: number
  borderStyle: BorderStyle
  fontSize: number
  fontWeight: FontWeight
  textAlign: TextAlign
  padding: number
  margin: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

export type UiComponent = {
  id: string
  typeId: ComponentTypeId
  props: ComponentProps
}

export type UiLink = {
  id: string
  kind: LinkKindId
  sourceId: string
  targetId: string
}

export type InterfaceModel = {
  id: string
  title: string
  components: UiComponent[]
  links: UiLink[]
}

export type CatalogEntry = {
  typeId: ComponentTypeId
  label: string
  preview: PreviewShape
  allowedProps: PropKey[]
  defaults: ComponentProps
}
