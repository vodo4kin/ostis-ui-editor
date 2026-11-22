import { useMemo, useState } from 'react'

import { useT, type MessageKey } from '../i18n'
import type { ComponentTypeId } from '../model/types'
import { PanelHeadLabel } from './PanelHeadLabel'
import { LIBRARY_TREE, type LibraryNode } from './libraryTree'

function filterTree(
  nodes: LibraryNode[],
  query: string,
  labelOf: (key: MessageKey) => string,
): LibraryNode[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return nodes
  }

  const result: LibraryNode[] = []
  for (const node of nodes) {
    const label = labelOf(node.labelKey)
    if (node.typeId) {
      if (label.toLowerCase().includes(q)) {
        result.push(node)
      }
      continue
    }

    const children = filterTree(node.children ?? [], q, labelOf)
    if (children.length > 0 || label.toLowerCase().includes(q)) {
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
  labelOf,
}: {
  node: LibraryNode
  openIds: Set<string>
  onToggle: (id: string) => void
  onPlace: (typeId: ComponentTypeId) => void
  depth: number
  labelOf: (key: MessageKey) => string
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
        <span>{labelOf(node.labelKey)}</span>
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
              labelOf={labelOf}
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
  const t = useT()
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(['output', 'decor', 'containers', 'input', 'actions']),
  )

  const visible = useMemo(
    () => filterTree(LIBRARY_TREE, query, t),
    [query, t],
  )

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
    <section
      className={
        collapsed
          ? 'left-panel left-panel--library left-panel--collapsed'
          : 'left-panel left-panel--library'
      }
    >
      <button
        type="button"
        className="panel-head panel-head--toggle"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="panel-head__mark">{collapsed ? '▸' : '▾'}</span>
        <PanelHeadLabel text={t('library.title')} />
      </button>
      {collapsed ? null : (
        <div className="panel-body library-body">
          <input
            className="library-search"
            type="search"
            placeholder={t('library.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="library-tree-scroll">
            <ul className="tree-list tree-list--root">
              {visible.map((node) => (
                <TreeItem
                  key={node.id}
                  node={node}
                  openIds={openIds}
                  onToggle={toggle}
                  onPlace={onPlaceType}
                  depth={0}
                  labelOf={t}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
