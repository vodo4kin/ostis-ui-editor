import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { useEditorSession } from '../model/useEditorSession'
import { ChatPanel } from './ChatPanel'
import { ContainsTreePanel } from './ContainsTreePanel'
import { DiffPanel } from './DiffPanel'
import { LibraryPanel } from './LibraryPanel'
import { PropertiesPanel } from './PropertiesPanel'
import {
  isTypingTarget,
  matchShortcut,
  nudgeStep,
} from './shortcuts'
import { Toolbar } from './Toolbar'
import { WorkArea } from './WorkArea'
import './editor.css'

export function EditorShell() {
  const t = useT()
  const session = useEditorSession()
  const [toolbarDialogOpen, setToolbarDialogOpen] = useState(false)
  const {
    undo,
    redo,
    deleteSelected,
    nudgeSelected,
    copySelected,
    cutSelected,
    pasteFromClipboard,
    duplicateSelected,
    selectAll,
    clearSelection,
    save,
    canSave,
    canExportCurrent,
    exportInterfaces,
    moveSelectedLayer,
    canMoveUp,
    canMoveDown,
    hasActiveInterface,
    scBusy,
  } = session
  const bodyLocked = scBusy || toolbarDialogOpen

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) {
        return
      }
      if (!hasActiveInterface || bodyLocked) {
        return
      }

      const action = matchShortcut(e)
      if (!action) {
        return
      }

      e.preventDefault()

      switch (action) {
        case 'exportCurrent':
          if (canExportCurrent) {
            void exportInterfaces('current', 'scs')
          }
          break
        case 'redo':
          redo()
          break
        case 'undo':
          undo()
          break
        case 'save':
          if (canSave) {
            void save()
          }
          break
        case 'selectAll':
          selectAll()
          break
        case 'duplicate':
          duplicateSelected()
          break
        case 'cut':
          cutSelected()
          break
        case 'copy':
          copySelected()
          break
        case 'paste':
          pasteFromClipboard()
          break
        case 'delete':
          deleteSelected()
          break
        case 'clearSelection':
          clearSelection()
          break
        case 'bringForward':
          if (canMoveUp) {
            moveSelectedLayer('up')
          }
          break
        case 'sendBackward':
          if (canMoveDown) {
            moveSelectedLayer('down')
          }
          break
        case 'nudgeLeft':
          nudgeSelected(-nudgeStep(e), 0)
          break
        case 'nudgeRight':
          nudgeSelected(nudgeStep(e), 0)
          break
        case 'nudgeUp':
          nudgeSelected(0, -nudgeStep(e))
          break
        case 'nudgeDown':
          nudgeSelected(0, nudgeStep(e))
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    hasActiveInterface,
    bodyLocked,
    undo,
    redo,
    deleteSelected,
    nudgeSelected,
    copySelected,
    cutSelected,
    pasteFromClipboard,
    duplicateSelected,
    selectAll,
    clearSelection,
    save,
    canSave,
    canExportCurrent,
    exportInterfaces,
    moveSelectedLayer,
    canMoveUp,
    canMoveDown,
  ])

  return (
    <div className="editor">
      <Toolbar
        interfaces={session.interfaces}
        activeInterfaceId={session.activeInterfaceId}
        activeInterfaceTitle={session.model.title}
        canUndo={session.canUndo}
        canRedo={session.canRedo}
        canSave={session.canSave}
        htmlTranslatorAvailable={session.htmlTranslatorAvailable}
        canPreview={session.canPreview}
        canCreate={session.canCreate}
        canRename={session.canRename}
        canDuplicate={session.canDuplicate}
        canDelete={session.canDelete}
        canExport={session.canExport}
        canExportCurrent={session.canExportCurrent}
        canExportAll={session.canExportAll}
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
        onRename={(title) => {
          void session.renameCurrent(title)
        }}
        onDuplicate={(title) => {
          void session.duplicateCurrent(title)
        }}
        onDelete={() => {
          void session.removeCurrent()
        }}
        onExport={(scope, format) => {
          void session.exportInterfaces(scope, format)
        }}
        onSave={() => {
          void session.save()
        }}
        onPreview={() => {
          void session.preview()
        }}
        onCopy={session.copySelected}
        onPaste={session.pasteFromClipboard}
        onUndo={session.undo}
        onRedo={session.redo}
        onReconnect={() => {
          void session.reconnect()
        }}
        onDialogOpenChange={setToolbarDialogOpen}
      />
      {hasActiveInterface ? (
        <div
          className={[
            'editor-body',
            session.selection.length > 0 ? 'editor-body--with-props' : '',
            toolbarDialogOpen ? 'editor-body--locked' : '',
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
            links={session.model.links}
            selectedIds={session.selectedIds}
            revealId={session.revealId}
            onRevealDone={session.clearReveal}
            onSelect={session.select}
            onSelectMany={session.selectMany}
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
            onGeometryLiveMany={(items) =>
              session.patchPropsLiveMany(items)
            }
          />
          {session.selection.length > 0 ? (
            <PropertiesPanel
              selection={session.selection}
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
          <p>{t('empty.pickInterface')}</p>
        </div>
      )}
    </div>
  )
}
