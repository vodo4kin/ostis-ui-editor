import { useEffect } from 'react'
import { useEditorSession } from '../model/useEditorSession'
import { ChatPanel } from './ChatPanel'
import { DiffPanel } from './DiffPanel'
import { LibraryPanel } from './LibraryPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { Toolbar } from './Toolbar'
import { WorkArea } from './WorkArea'
import './editor.css'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true
  }
  return target.isContentEditable
}

export function EditorShell() {
  const session = useEditorSession()
  const { undo, deleteSelected } = session

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) {
        return
      }

      const mod = e.ctrlKey || e.metaKey

      if (mod && e.code === 'KeyZ') {
        e.preventDefault()
        undo()
        return
      }

      if (e.key === 'Delete') {
        e.preventDefault()
        deleteSelected()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, deleteSelected])

  return (
    <div className="editor">
      <Toolbar
        canUndo={session.canUndo}
        onNew={session.createNew}
        onUndo={session.undo}
      />
      <div
        className={
          session.selected
            ? 'editor-body editor-body--with-props'
            : 'editor-body'
        }
      >
        <LibraryPanel onPlaceType={session.placeType} />
        <WorkArea
          components={session.model.components}
          selectedId={session.selectedId}
          onSelect={session.select}
          onMoveStart={session.pushCheckpoint}
          onMoveLive={(id, x, y) => session.patchPropsLive(id, { x, y })}
        />
        {session.selected ? (
          <PropertiesPanel
            selected={session.selected}
            components={session.model.components}
            links={session.model.links}
            onPatch={session.patchProps}
            onDelete={session.deleteSelected}
            onLinkTo={session.linkTo}
            onDropLink={session.dropLink}
          />
        ) : null}
        <aside className="editor-col editor-col--side">
          <DiffPanel />
          <ChatPanel />
        </aside>
      </div>
    </div>
  )
}
