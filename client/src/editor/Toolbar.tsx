type ToolbarProps = {
  canUndo: boolean
  canSaveVersion: boolean
  canCopy: boolean
  canPaste: boolean
  onNew: () => void
  onSaveVersion: () => void
  onCopy: () => void
  onPaste: () => void
  onUndo: () => void
}

export function Toolbar({
  canUndo,
  canSaveVersion,
  canCopy,
  canPaste,
  onNew,
  onSaveVersion,
  onCopy,
  onPaste,
  onUndo,
}: ToolbarProps) {
  return (
    <header className="editor-toolbar">
      <span className="editor-toolbar__title">Редактор ПИ</span>
      <label className="editor-toolbar__iface">
        <span>Интерфейс</span>
        <select defaultValue="python_tutor" disabled>
          <option value="python_tutor">python_tutor (черновик)</option>
        </select>
      </label>
      <button type="button" onClick={onNew}>
        Новый интерфейс
      </button>
      <button
        type="button"
        onClick={onSaveVersion}
        disabled={!canSaveVersion}
      >
        Сохранить версию
      </button>
      <button type="button" disabled>
        Опубликовать
      </button>

      <span className="editor-toolbar__gap" />

      <button type="button" onClick={onCopy} disabled={!canCopy}>
        Копировать
      </button>
      <button type="button" onClick={onPaste} disabled={!canPaste}>
        Вставить
      </button>
      <button type="button" onClick={onUndo} disabled={!canUndo}>
        Отменить
      </button>

      <button type="button" className="editor-toolbar__preview" disabled>
        Предпросмотр
      </button>
    </header>
  )
}
