import { useState } from 'react'
import {
  changeTargetId,
  type ModelChange,
} from '../model/modelDiff'
import { PanelHeadLabel } from './PanelHeadLabel'

type DiffPanelProps = {
  changes: ModelChange[]
  onSelect: (componentId: string | null) => void
  onRevert: (change: ModelChange) => void
}

export function DiffPanel({ changes, onSelect, onRevert }: DiffPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section
      className={
        collapsed
          ? 'editor-stack-panel editor-stack-panel--diff editor-stack-panel--collapsed'
          : 'editor-stack-panel editor-stack-panel--diff'
      }
    >
      <button
        type="button"
        className="panel-head panel-head--toggle"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="panel-head__mark">{collapsed ? '▸' : '▾'}</span>
        <PanelHeadLabel text="Различия модели" />
      </button>
      {collapsed ? null : (
        <div className="panel-body diff-body">
          {changes.length === 0 ? (
            <p className="prop-empty">Нет несохранённых изменений.</p>
          ) : (
            <ul className="diff-list">
              {changes.map((change) => {
                const targetId = changeTargetId(change)
                return (
                  <li key={change.id} className="diff-item">
                    <button
                      type="button"
                      className="diff-item__main"
                      onClick={() => onSelect(targetId)}
                    >
                      {change.label}{' '}
                      <span className="prop-id">({change.idHint})</span>
                    </button>
                    <button
                      type="button"
                      className="diff-item__revert"
                      title="Вернуть"
                      onClick={() => onRevert(change)}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
