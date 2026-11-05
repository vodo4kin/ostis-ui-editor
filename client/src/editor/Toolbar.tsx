type ToolbarProps = {
  canUndo: boolean
  onNew: () => void
  onUndo: () => void
}

export function Toolbar({ canUndo, onNew, onUndo }: ToolbarProps) {
  return (
    <header className="editor-toolbar">
      <span className="editor-toolbar__title">Редактор ПИ</span>
      <button type="button" onClick={onNew}>
        Новый
      </button>
      <button type="button" disabled>
        Сохранить версию
      </button>
      <button type="button" disabled>
        Опубликовать
      </button>
      <button type="button" onClick={onUndo} disabled={!canUndo}>
        Отменить
      </button>
    </header>
  )
}
