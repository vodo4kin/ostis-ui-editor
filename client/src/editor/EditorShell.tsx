import { useEffect } from 'react'
import { useEditorSession } from '../model/useEditorSession'
import { ChatPanel } from './ChatPanel'
import { ContainsTreePanel } from './ContainsTreePanel'
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
  const {
    undo,
    deleteSelected,
    nudgeSelected,
    copySelected,
    pasteFromClipboard,
    save,
    canSave,
    hasActiveInterface,
    scBusy,
  } = session

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) {
        return
      }
      if (!hasActiveInterface || scBusy) {
        return
      }

      const mod = e.ctrlKey || e.metaKey

      if (mod && e.code === 'KeyZ') {
        e.preventDefault()
        undo()
        return
      }

      if (mod && e.code === 'KeyS') {
        e.preventDefault()
        if (canSave) {
          void save()
        }
        return
      }

      if (mod && e.code === 'KeyC') {
        e.preventDefault()
        copySelected()
        return
      }

      if (mod && e.code === 'KeyV') {
        e.preventDefault()
        pasteFromClipboard()
        return
      }

      if (e.key === 'Delete') {
        e.preventDefault()
        deleteSelected()
        return
      }

      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        e.preventDefault()
        if (e.key === 'ArrowLeft') nudgeSelected(-1, 0)
        if (e.key === 'ArrowRight') nudgeSelected(1, 0)
        if (e.key === 'ArrowUp') nudgeSelected(0, -1)
        if (e.key === 'ArrowDown') nudgeSelected(0, 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    hasActiveInterface,
    scBusy,
    undo,
    deleteSelected,
    nudgeSelected,
    copySelected,
    pasteFromClipboard,
    save,
    canSave,
  ])

  return (
    <div className="editor">
      <Toolbar
        interfaces={session.interfaces}
        activeInterfaceId={session.activeInterfaceId}
        activeInterfaceTitle={session.model.title}
        canUndo={session.canUndo}
        canSave={session.canSave}
        canCreate={session.canCreate}
        canDelete={session.canDelete}
        canSelect={session.canSelect}
        canCopy={session.canCopy}
        canPaste={session.canPaste}
        scConnected={session.scConnected}
        scBusy={session.scBusy}
        scMessage={session.scMessage}
        onSelectInterface={(id) => {
          void session.selectInterface(id)
        }}
        onCreate={(title) => {
          void session.createNew(title)
        }}
        onDelete={() => {
          void session.removeCurrent()
        }}
        onSave={() => {
          void session.save()
        }}
        onCopy={session.copySelected}
        onPaste={session.pasteFromClipboard}
        onUndo={session.undo}
        onReconnect={() => {
          void session.reconnect()
        }}
      />
      {hasActiveInterface ? (
        <div
          className={[
            'editor-body',
            session.selected ? 'editor-body--with-props' : '',
            scBusy ? 'editor-body--busy' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <aside className="editor-col editor-col--left">
            <LibraryPanel onPlaceType={session.placeType} />
            <ContainsTreePanel
              components={session.model.components}
              links={session.model.links}
              selectedIds={session.selectedIds}
              onSelect={(id) => session.select(id)}
            />
          </aside>
          <WorkArea
            components={session.model.components}
            selectedIds={session.selectedIds}
            revealId={session.revealId}
            onRevealDone={session.clearReveal}
            onSelect={session.select}
            onGeometryStart={session.pushCheckpoint}
            onGeometryLive={(id, patch) => session.patchPropsLive(id, patch)}
            onMoveLiveMany={(items) =>
              session.patchPropsLiveMany(
                items.map((item) => ({
                  id: item.id,
                  patch: { x: item.x, y: item.y },
                })),
              )
            }
          />
          {session.selected ? (
            <PropertiesPanel
              selected={session.selected}
              components={session.model.components}
              links={session.model.links}
              onPatch={session.patchProps}
              onDelete={session.deleteSelected}
              onMoveLayer={session.moveSelectedLayer}
              canMoveUp={session.canMoveUp}
              canMoveDown={session.canMoveDown}
              onLinkTo={session.linkTo}
              onDropLink={session.dropLink}
            />
          ) : null}
          <aside className="editor-col editor-col--side">
            <DiffPanel
              changes={session.changes}
              onSelect={(id) => session.select(id)}
              onRevert={session.revertModelChange}
            />
            <ChatPanel />
          </aside>
        </div>
      ) : (
        <div className="editor-empty">
          <p>Выберите существующий интерфейс или создайте новый</p>
        </div>
      )}
    </div>
  )
}
