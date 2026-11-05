import { useMemo, useState } from 'react'
import type { ComponentTypeId } from '../model/types'
import { LIBRARY_TREE, type LibraryNode } from './libraryTree'

function filterTree(nodes: LibraryNode[], query: string): LibraryNode[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return nodes
  }

  const result: LibraryNode[] = []
  for (const node of nodes) {
    if (node.typeId) {
      if (node.label.toLowerCase().includes(q)) {
        result.push(node)
      }
      continue
    }

    const children = filterTree(node.children ?? [], q)
    if (children.length > 0 || node.label.toLowerCase().includes(q)) {
      result.push({
        ...node,
        children: children.length > 0 ? children : node.children,
      })
    }
  }
  return result
}

function TreeItem({
  node,
  openIds,
  onToggle,
  onPlace,
  depth,
}: {
  node: LibraryNode
  openIds: Set<string>
  onToggle: (id: string) => void
  onPlace: (typeId: ComponentTypeId) => void
  depth: number
}) {
  const hasChildren = Boolean(node.children?.length)
  const isOpen = openIds.has(node.id)

  return (
    <li className="tree-item">
      <button
        type="button"
        className="tree-row"
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id)
            return
          }
          if (node.typeId) {
            onPlace(node.typeId)
          }
        }}
      >
        <span className="tree-twist">
          {hasChildren ? (isOpen ? '▾' : '▸') : '·'}
        </span>
        <span>{node.label}</span>
      </button>
      {hasChildren && isOpen ? (
        <ul className="tree-list">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              openIds={openIds}
              onToggle={onToggle}
              onPlace={onPlace}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

type LibraryPanelProps = {
  onPlaceType: (typeId: ComponentTypeId) => void
}

export function LibraryPanel({ onPlaceType }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(['layout', 'input', 'display', 'dialog', 'tutor']),
  )

  const visible = useMemo(() => filterTree(LIBRARY_TREE, query), [query])

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <section className="editor-col">
      <div className="panel-head">Типовые компоненты</div>
      <div className="panel-body library-body">
        <input
          className="library-search"
          type="search"
          placeholder="Поиск компонента..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="tree-list tree-list--root">
          {visible.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              openIds={openIds}
              onToggle={toggle}
              onPlace={onPlaceType}
              depth={0}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
