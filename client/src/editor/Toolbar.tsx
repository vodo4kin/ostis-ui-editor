type ToolbarProps = {
  onNew?: () => void
  onSaveVersion?: () => void
  onPublish?: () => void
  onUndo?: () => void
}

export function Toolbar({
  onNew,
  onSaveVersion,
  onPublish,
  onUndo,
}: ToolbarProps) {
  return (
    <header className="editor-toolbar">
      <span className="editor-toolbar__title">Редактор ПИ</span>
      <button type="button" onClick={onNew}>
        Новый
      </button>
      <button type="button" onClick={onSaveVersion}>
        Сохранить версию
      </button>
      <button type="button" onClick={onPublish}>
        Опубликовать
      </button>
      <button type="button" onClick={onUndo}>
        Отменить
      </button>
    </header>
  )
}
