import {
  ACTION_PROPS,
  APPEARANCE_PROPS,
  BASE_PROPS,
  DIVIDER_EXTRA,
  INPUT_PROPS,
  LAYOUT_PROPS,
  LIMIT_PROPS,
  ROLE_PROPS,
  TEXT_PROPS,
  mergeProps,
} from './propSets'
import type {
  CatalogEntry,
  ComponentProps,
  ComponentTypeId,
  LinkKindId,
  PreviewShape,
  PropKey,
} from './types'

function baseProps(partial: Partial<ComponentProps> & Pick<ComponentProps, 'name' | 'width' | 'height'>): ComponentProps {
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
    margin: partial.margin ?? 0,
    tooltip: partial.tooltip ?? '',
    backgroundColor: partial.backgroundColor ?? '#f4f4f4',
    color: partial.color ?? '#1a1a1a',
    borderColor: partial.borderColor ?? '#6f6f6f',
    borderWidth: partial.borderWidth ?? 1,
    borderStyle: partial.borderStyle ?? 'solid',
    borderRadius: partial.borderRadius ?? 0,
    fontSize: partial.fontSize ?? 13,
    fontWeight: partial.fontWeight ?? 'normal',
    textAlign: partial.textAlign ?? 'left',
    padding: partial.padding ?? 0,
    flexGrow: partial.flexGrow ?? 0,
    flexShrink: partial.flexShrink ?? 1,
    alignSelf: partial.alignSelf ?? 'auto',
    minWidth: partial.minWidth ?? 0,
    minHeight: partial.minHeight ?? 0,
    maxWidth: partial.maxWidth ?? 0,
    maxHeight: partial.maxHeight ?? 0,
    text: partial.text ?? '',
    placeholder: partial.placeholder ?? '',
    readOnly: partial.readOnly ?? false,
    semanticRole: partial.semanticRole ?? '',
    actionId: partial.actionId ?? '',
  }
}

function entry(
  typeId: ComponentTypeId,
  label: string,
  preview: PreviewShape,
  allowedProps: PropKey[],
  defaults: ComponentProps,
): CatalogEntry {
  return { typeId, label, preview, allowedProps, defaults }
}

export const COMPONENT_CATALOG: CatalogEntry[] = [
  entry(
    'container',
    'Контейнер',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS),
    baseProps({
      name: 'Контейнер',
      width: 280,
      height: 160,
      backgroundColor: '#ececec',
      padding: 8,
    }),
  ),
  entry(
    'row',
    'Строка',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS),
    baseProps({
      name: 'Строка',
      width: 300,
      height: 52,
      backgroundColor: '#e8eef5',
      padding: 4,
    }),
  ),
  entry(
    'column',
    'Столбец',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS),
    baseProps({
      name: 'Столбец',
      width: 140,
      height: 200,
      backgroundColor: '#eef5e8',
      padding: 4,
    }),
  ),
  entry(
    'divider',
    'Разделитель',
    'rect',
    mergeProps(BASE_PROPS, DIVIDER_EXTRA),
    baseProps({
      name: 'Разделитель',
      width: 280,
      height: 10,
      backgroundColor: '#b0b0b0',
      borderWidth: 0,
      borderStyle: 'none',
      enabled: true,
    }),
  ),
  entry(
    'text_field',
    'Поле текста',
    'rounded',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, INPUT_PROPS, LIMIT_PROPS),
    baseProps({
      name: 'Поле текста',
      width: 240,
      height: 40,
      backgroundColor: '#ffffff',
      borderRadius: 4,
      placeholder: 'Введите текст',
      textAlign: 'left',
    }),
  ),
  entry(
    'button',
    'Кнопка',
    'rounded',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, TEXT_PROPS, ACTION_PROPS, ROLE_PROPS, LIMIT_PROPS),
    baseProps({
      name: 'Кнопка',
      width: 140,
      height: 40,
      backgroundColor: '#dfe8f5',
      borderRadius: 6,
      text: 'Кнопка',
      textAlign: 'center',
      fontWeight: 'bold',
    }),
  ),
  entry(
    'list',
    'Список',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LIMIT_PROPS),
    baseProps({
      name: 'Список',
      width: 220,
      height: 130,
      backgroundColor: '#ffffff',
    }),
  ),
  entry(
    'label',
    'Текстовая метка',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, TEXT_PROPS),
    baseProps({
      name: 'Метка',
      width: 180,
      height: 36,
      backgroundColor: 'transparent',
      borderStyle: 'none',
      borderWidth: 0,
      text: 'Метка',
    }),
  ),
  entry(
    'task_panel',
    'Панель условия задания',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Условие задания',
      width: 320,
      height: 120,
      padding: 8,
      text: 'Условие',
      semanticRole: 'task',
      minWidth: 200,
      minHeight: 80,
    }),
  ),
  entry(
    'code_editor',
    'Редактор кода',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, INPUT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Редактор кода',
      width: 360,
      height: 180,
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      padding: 8,
      placeholder: '# код',
      semanticRole: 'code',
      minWidth: 240,
      minHeight: 120,
      fontSize: 12,
    }),
  ),
  entry(
    'results_panel',
    'Панель результатов проверки',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Результаты проверки',
      width: 280,
      height: 100,
      padding: 8,
      semanticRole: 'results',
      text: 'Результаты',
    }),
  ),
  entry(
    'dialog_panel',
    'Панель диалога с ассистентом',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Диалог',
      width: 280,
      height: 160,
      padding: 8,
      semanticRole: 'dialog',
      text: 'Диалог',
    }),
  ),
  entry(
    'hints_panel',
    'Панель подсказок',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Подсказки',
      width: 240,
      height: 100,
      padding: 8,
      semanticRole: 'hints',
      text: 'Подсказка',
      backgroundColor: '#fff8e6',
    }),
  ),
  entry(
    'history_panel',
    'Панель истории',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'История',
      width: 240,
      height: 120,
      padding: 8,
      semanticRole: 'history',
      text: 'История',
    }),
  ),
  entry(
    'steps_panel',
    'Панель шагов',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Шаги',
      width: 220,
      height: 140,
      padding: 8,
      semanticRole: 'steps',
      text: 'Шаги',
    }),
  ),
  entry(
    'solution_panel',
    'Панель решения',
    'rect',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS, ROLE_PROPS),
    baseProps({
      name: 'Решение',
      width: 280,
      height: 120,
      padding: 8,
      semanticRole: 'solution',
      text: 'Решение',
    }),
  ),
  entry(
    'bubble',
    'Пузырь',
    'pill',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, TEXT_PROPS),
    baseProps({
      name: 'Пузырь',
      width: 200,
      height: 64,
      backgroundColor: '#e7f0ff',
      borderRadius: 28,
      text: 'Сообщение',
      textAlign: 'center',
      padding: 8,
    }),
  ),
  entry(
    'modal',
    'Модальное окно',
    'rounded',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, LAYOUT_PROPS, LIMIT_PROPS, TEXT_PROPS),
    baseProps({
      name: 'Модальное окно',
      width: 300,
      height: 180,
      backgroundColor: '#ffffff',
      borderRadius: 10,
      padding: 12,
      text: 'Модальное окно',
    }),
  ),
  entry(
    'tabs',
    'Вкладки',
    'rounded',
    mergeProps(BASE_PROPS, APPEARANCE_PROPS, TEXT_PROPS),
    baseProps({
      name: 'Вкладки',
      width: 300,
      height: 44,
      backgroundColor: '#f0f0f0',
      borderRadius: 6,
      text: 'Вкладка 1 | Вкладка 2',
      textAlign: 'center',
    }),
  ),
]

export const LINK_KINDS: { id: LinkKindId; label: string }[] = [
  { id: 'contains', label: 'Вложение' },
  { id: 'code_link', label: 'К коду' },
  { id: 'result_link', label: 'К результату' },
  { id: 'dialog_link', label: 'К диалогу' },
  { id: 'history_link', label: 'К истории' },
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
