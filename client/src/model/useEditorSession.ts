import { useCallback, useMemo, useRef, useState } from 'react'
import type {
  ComponentProps,
  ComponentTypeId,
  InterfaceModel,
  LinkKindId,
} from './types'
import {
  addComponent,
  addLink,
  createEmptyModel,
  moveComponentLayer,
  pasteClipboard,
  removeComponents,
  removeLink,
  takeClipboard,
  updateComponentProps,
  type EditorClipboard,
} from './modelOps'
import {
  cloneModel,
  diffModels,
  revertChange,
  type ModelChange,
} from './modelDiff'

const HISTORY_LIMIT = 50

export function useEditorSession() {
  const [model, setModel] = useState<InterfaceModel>(() => createEmptyModel())
  const [baseline, setBaseline] = useState<InterfaceModel>(() =>
    createEmptyModel(),
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [history, setHistory] = useState<InterfaceModel[]>([])
  const [clipboard, setClipboard] = useState<EditorClipboard | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const modelRef = useRef(model)
  modelRef.current = model
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const clipboardRef = useRef(clipboard)
  clipboardRef.current = clipboard
  const pasteCountRef = useRef(0)

  const changes = useMemo(
    () => diffModels(baseline, model),
    [baseline, model],
  )

  const pushCheckpoint = useCallback(() => {
    const snapshot = structuredClone(modelRef.current)
    setHistory((h) => {
      const stack = [...h, snapshot]
      if (stack.length > HISTORY_LIMIT) {
        stack.shift()
      }
      return stack
    })
  }, [])

  const commit = useCallback((prev: InterfaceModel, next: InterfaceModel) => {
    if (next === prev) {
      return prev
    }
    setHistory((h) => {
      const stack = [...h, structuredClone(prev)]
      if (stack.length > HISTORY_LIMIT) {
        stack.shift()
      }
      return stack
    })
    return next
  }, [])

  const createNew = useCallback(() => {
    const empty = createEmptyModel()
    setHistory([])
    setSelectedIds([])
    setBaseline(cloneModel(empty))
    setModel(empty)
  }, [])

  const saveVersion = useCallback(() => {
    setBaseline(cloneModel(modelRef.current))
  }, [])

  const placeType = useCallback(
    (typeId: ComponentTypeId) => {
      setModel((prev) => {
        const { model: next, componentId } = addComponent(prev, typeId)
        setSelectedIds([componentId])
        setRevealId(componentId)
        return commit(prev, next)
      })
    },
    [commit],
  )

  const select = useCallback((id: string | null, additive = false) => {
    if (id === null) {
      setSelectedIds([])
      return
    }
    if (!additive) {
      setSelectedIds([id])
      return
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const patchProps = useCallback(
    (componentId: string, patch: Partial<ComponentProps>) => {
      setModel((prev) =>
        commit(prev, updateComponentProps(prev, componentId, patch)),
      )
    },
    [commit],
  )

  const patchPropsLive = useCallback(
    (componentId: string, patch: Partial<ComponentProps>) => {
      setModel((prev) => updateComponentProps(prev, componentId, patch))
    },
    [],
  )

  const patchPropsLiveMany = useCallback(
    (items: { id: string; patch: Partial<ComponentProps> }[]) => {
      if (items.length === 0) {
        return
      }
      setModel((prev) => {
        let next = prev
        for (const item of items) {
          next = updateComponentProps(next, item.id, item.patch)
        }
        return next
      })
    },
    [],
  )

  const deleteSelected = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length === 0) {
      return
    }
    setSelectedIds([])
    setModel((prev) => commit(prev, removeComponents(prev, ids)))
  }, [commit])

  const moveSelectedLayer = useCallback(
    (direction: 'up' | 'down') => {
      const ids = selectedIdsRef.current
      if (ids.length !== 1) {
        return
      }
      setModel((prev) =>
        commit(prev, moveComponentLayer(prev, ids[0], direction)),
      )
    },
    [commit],
  )

  const copySelected = useCallback(() => {
    const clip = takeClipboard(modelRef.current, selectedIdsRef.current)
    if (!clip) {
      return
    }
    pasteCountRef.current = 0
    setClipboard(clip)
  }, [])

  const pasteFromClipboard = useCallback(() => {
    const clip = clipboardRef.current
    if (!clip) {
      return
    }
    pasteCountRef.current += 1
    const offset = 24 * pasteCountRef.current
    setModel((prev) => {
      const { model: next, newIds } = pasteClipboard(prev, clip, offset)
      if (newIds.length === 0) {
        return prev
      }
      setSelectedIds(newIds)
      setRevealId(newIds[0] ?? null)
      return commit(prev, next)
    })
  }, [commit])

  const clearReveal = useCallback(() => {
    setRevealId(null)
  }, [])

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      const ids = selectedIdsRef.current
      if (ids.length === 0) {
        return
      }
      setModel((prev) => {
        let next = prev
        let changed = false
        for (const id of ids) {
          const item = next.components.find((c) => c.id === id)
          if (!item) {
            continue
          }
          const x = Math.max(0, item.props.x + dx)
          const y = Math.max(0, item.props.y + dy)
          if (x === item.props.x && y === item.props.y) {
            continue
          }
          next = updateComponentProps(next, id, { x, y })
          changed = true
        }
        return changed ? commit(prev, next) : prev
      })
    },
    [commit],
  )

  const linkTo = useCallback(
    (kind: LinkKindId, targetId: string) => {
      const ids = selectedIdsRef.current
      if (ids.length !== 1) {
        return
      }
      setModel((prev) => commit(prev, addLink(prev, kind, ids[0], targetId)))
    },
    [commit],
  )

  const dropLink = useCallback(
    (linkId: string) => {
      setModel((prev) => commit(prev, removeLink(prev, linkId)))
    },
    [commit],
  )

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) {
        return h
      }
      const prev = h[h.length - 1]
      setModel(prev)
      setSelectedIds((cur) =>
        cur.filter((id) => prev.components.some((c) => c.id === id)),
      )
      return h.slice(0, -1)
    })
  }, [])

  const revertModelChange = useCallback(
    (change: ModelChange) => {
      setModel((prev) => {
        const next = revertChange(prev, baseline, change)
        if (next === prev) {
          return prev
        }
        return commit(prev, next)
      })
    },
    [baseline, commit],
  )

  const selected =
    selectedIds.length === 1
      ? (model.components.find((c) => c.id === selectedIds[0]) ?? null)
      : null

  const layerIndex = useMemo(() => {
    if (!selected) {
      return -1
    }
    const sorted = [...model.components].sort(
      (a, b) => a.props.order - b.props.order,
    )
    return sorted.findIndex((c) => c.id === selected.id)
  }, [model.components, selected])

  const layerCount = model.components.length

  return {
    model,
    selected,
    selectedIds,
    revealId,
    canUndo: history.length > 0,
    canCopy: selectedIds.length > 0,
    canPaste: clipboard !== null,
    canMoveUp: selected !== null && layerIndex >= 0 && layerIndex < layerCount - 1,
    canMoveDown: selected !== null && layerIndex > 0,
    changes,
    canSaveVersion: changes.length > 0,
    createNew,
    saveVersion,
    placeType,
    select,
    patchProps,
    patchPropsLive,
    patchPropsLiveMany,
    pushCheckpoint,
    deleteSelected,
    moveSelectedLayer,
    copySelected,
    pasteFromClipboard,
    clearReveal,
    nudgeSelected,
    linkTo,
    dropLink,
    undo,
    revertModelChange,
  }
}
