import { useMemo, useState } from 'react'

type TreeNode = {
  id: string
  label: string
  children?: TreeNode[]
}

const TREE: TreeNode[] = [
  {
    id: 'layout',
    label: 'Макет',
    children: [
      { id: 'container', label: 'Контейнер' },
      { id: 'row', label: 'Строка' },
      { id: 'column', label: 'Столбец' },
      { id: 'divider', label: 'Разделитель' },
    ],
  },
  {
    id: 'input',
    label: 'Ввод',
    children: [
      { id: 'text-field', label: 'Поле текста' },
      { id: 'button', label: 'Кнопка' },
      { id: 'list', label: 'Список' },
    ],
  },
  {
    id: 'display',
    label: 'Отображение',
    children: [
      { id: 'label', label: 'Текстовая метка' },
      { id: 'results', label: 'Панель результатов' },
    ],
  },
  {
    id: 'dialog',
    label: 'Диалог',
    children: [
      { id: 'bubble', label: 'Пузырь' },
      { id: 'modal', label: 'Модальное окно' },
      { id: 'assistant-dialog', label: 'Панель диалога с ассистентом' },
    ],
  },
  {
    id: 'nav',
    label: 'Навигация',
    children: [{ id: 'tabs', label: 'Вкладки' }],
  },
  {
    id: 'tutor',
    label: 'Учебный ассистент',
    children: [
      { id: 'task-panel', label: 'Панель условия задания' },
      { id: 'code-editor', label: 'Редактор кода' },
      { id: 'check-results', label: 'Панель результатов проверки' },
      { id: 'hints-panel', label: 'Панель подсказок' },
    ],
  },
]

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return nodes
  }

  const result: TreeNode[] = []
  for (const node of nodes) {
    if (!node.children) {
      if (node.label.toLowerCase().includes(q)) {
        result.push(node)
      }
      continue
    }

    const children = filterTree(node.children, q)
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
  depth,
}: {
  node: TreeNode
  openIds: Set<string>
  onToggle: (id: string) => void
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
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function LibraryPanel() {
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(['layout', 'input', 'dialog', 'tutor']),
  )

  const visible = useMemo(() => filterTree(TREE, query), [query])

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
              depth={0}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
