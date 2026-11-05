export type ComponentTypeId =
  | 'container'
  | 'row'
  | 'column'
  | 'divider'
  | 'text_field'
  | 'button'
  | 'list'
  | 'label'
  | 'task_panel'
  | 'code_editor'
  | 'results_panel'
  | 'dialog_panel'
  | 'hints_panel'
  | 'history_panel'
  | 'steps_panel'
  | 'solution_panel'
  | 'bubble'
  | 'modal'
  | 'tabs'

export type LinkKindId =
  | 'contains'
  | 'code_link'
  | 'result_link'
  | 'dialog_link'
  | 'history_link'

export type PreviewShape = 'rect' | 'rounded' | 'pill'

export type BorderStyle = 'solid' | 'dashed' | 'none'
export type FontWeight = 'normal' | 'bold'
export type TextAlign = 'left' | 'center' | 'right'
export type AlignSelf = 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch'

export type PropKey = keyof ComponentProps

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
  margin: number
  tooltip: string
  backgroundColor: string
  color: string
  borderColor: string
  borderWidth: number
  borderStyle: BorderStyle
  borderRadius: number
  fontSize: number
  fontWeight: FontWeight
  textAlign: TextAlign
  padding: number
  flexGrow: number
  flexShrink: number
  alignSelf: AlignSelf
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  text: string
  placeholder: string
  readOnly: boolean
  semanticRole: string
  actionId: string
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
