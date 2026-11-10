import { useEffect, useMemo, useRef, useState } from 'react'
import { PanelHeadLabel } from './PanelHeadLabel'
import type { UiComponent, UiLink } from '../model/types'
import {
  ancestorIdsFor,
  buildContainsForest,
  type ContainsNode,
} from './containsTree'

function ContainsItem({
  node,
  openIds,
  selectedIds,
  onToggle,
  onSelect,
  depth,
}: {
  node: ContainsNode
  openIds: Set<string>
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  depth: number
}) {
  const hasChildren = node.children.length > 0
  const isOpen = openIds.has(node.id)
  const selected = selectedIds.includes(node.id)

  return (
    <li className="tree-item">
      <button
        type="button"
        data-contains-id={node.id}
        className={
          selected ? 'tree-row tree-row--selected' : 'tree-row'
        }
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id)
          }
          onSelect(node.id)
        }}
      >
        <span className="tree-twist">
          {hasChildren ? (isOpen ? '▾' : '▸') : '·'}
        </span>
        <span>{node.label}</span>
      </button>
      {hasChildren && isOpen ? (
        <ul className="tree-list">
          {node.children.map((child) => (
            <ContainsItem
              key={child.id}
              node={child}
              openIds={openIds}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

type ContainsTreePanelProps = {
  components: UiComponent[]
  links: UiLink[]
  selectedIds: string[]
  onSelect: (id: string) => void
}

export function ContainsTreePanel({
  components,
  links,
  selectedIds,
  onSelect,
}: ContainsTreePanelProps) {
  const forest = useMemo(
    () => buildContainsForest(components, links),
    [components, links],
  )
  const [collapsed, setCollapsed] = useState(false)
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedIds.length === 0) {
      return
    }
    const toOpen: string[] = []
    for (const id of selectedIds) {
      toOpen.push(...ancestorIdsFor(components, links, id))
    }
    if (toOpen.length === 0) {
      return
    }
    setOpenIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const id of toOpen) {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [selectedIds, components, links])

  useEffect(() => {
    if (collapsed || selectedIds.length === 0) {
      return
    }
    const focusId = selectedIds[selectedIds.length - 1]
    const body = bodyRef.current
    if (!body) {
      return
    }
    const row = body.querySelector(
      `[data-contains-id="${focusId}"]`,
    ) as HTMLElement | null
    if (!row) {
      return
    }
    row.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selectedIds, openIds, collapsed])

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
          ? 'left-panel left-panel--structure left-panel--collapsed'
          : 'left-panel left-panel--structure'
      }
    >
      <button
        type="button"
        className="panel-head panel-head--toggle"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="panel-head__mark">{collapsed ? '▸' : '▾'}</span>
        <PanelHeadLabel text="Вложения" />
      </button>
      {collapsed ? null : (
        <div className="panel-body" ref={bodyRef}>
          {forest.length === 0 ? (
            <p className="prop-empty">Нет компонентов.</p>
          ) : (
            <ul className="tree-list tree-list--root">
              {forest.map((node) => (
                <ContainsItem
                  key={node.id}
                  node={node}
                  openIds={openIds}
                  selectedIds={selectedIds}
                  onToggle={toggle}
                  onSelect={onSelect}
                  depth={0}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
