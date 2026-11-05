import type { ComponentTypeId } from '../model/types'

export type LibraryNode = {
  id: string
  label: string
  typeId?: ComponentTypeId
  children?: LibraryNode[]
}

export const LIBRARY_TREE: LibraryNode[] = [
  {
    id: 'layout',
    label: 'Макет',
    children: [
      { id: 'container', label: 'Контейнер', typeId: 'container' },
      { id: 'row', label: 'Строка', typeId: 'row' },
      { id: 'column', label: 'Столбец', typeId: 'column' },
      { id: 'divider', label: 'Разделитель', typeId: 'divider' },
    ],
  },
  {
    id: 'input',
    label: 'Ввод',
    children: [
      { id: 'text_field', label: 'Поле текста', typeId: 'text_field' },
      { id: 'button', label: 'Кнопка', typeId: 'button' },
      { id: 'list', label: 'Список', typeId: 'list' },
    ],
  },
  {
    id: 'display',
    label: 'Отображение',
    children: [
      { id: 'label', label: 'Текстовая метка', typeId: 'label' },
      { id: 'results_panel', label: 'Панель результатов проверки', typeId: 'results_panel' },
      { id: 'hints_panel', label: 'Панель подсказок', typeId: 'hints_panel' },
      { id: 'history_panel', label: 'Панель истории', typeId: 'history_panel' },
      { id: 'steps_panel', label: 'Панель шагов', typeId: 'steps_panel' },
      { id: 'solution_panel', label: 'Панель решения', typeId: 'solution_panel' },
    ],
  },
  {
    id: 'dialog',
    label: 'Диалог',
    children: [
      { id: 'bubble', label: 'Пузырь', typeId: 'bubble' },
      { id: 'modal', label: 'Модальное окно', typeId: 'modal' },
      { id: 'dialog_panel', label: 'Панель диалога с ассистентом', typeId: 'dialog_panel' },
    ],
  },
  {
    id: 'nav',
    label: 'Навигация',
    children: [{ id: 'tabs', label: 'Вкладки', typeId: 'tabs' }],
  },
  {
    id: 'tutor',
    label: 'Учебный ассистент',
    children: [
      { id: 'task_panel', label: 'Панель условия задания', typeId: 'task_panel' },
      { id: 'code_editor', label: 'Редактор кода', typeId: 'code_editor' },
    ],
  },
]
