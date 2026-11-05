import { ChatPanel } from './ChatPanel'
import { DiffPanel } from './DiffPanel'
import { InterfaceListPanel } from './InterfaceListPanel'
import { LibraryPanel } from './LibraryPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { Toolbar } from './Toolbar'
import { WorkArea } from './WorkArea'
import './editor.css'

export function EditorShell() {
  return (
    <div className="editor">
      <Toolbar />
      <div className="editor-body">
        <InterfaceListPanel />
        <LibraryPanel />
        <WorkArea />
        <PropertiesPanel />
        <DiffPanel />
        <ChatPanel />
      </div>
    </div>
  )
}
