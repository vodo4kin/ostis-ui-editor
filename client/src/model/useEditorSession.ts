import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteModelFromSc,
  listInterfacesFromSc,
  readModelFromSc,
  resetScClient,
  writeModelToSc,
  type ScInterfaceRef,
} from '../sc'
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
import { normalizeInterfaceTitle, validateInterfaceTitle } from './limits'

const HISTORY_LIMIT = 50

const KB_CONNECTING = 'Подключение к БЗ…'
const KB_WORKING = 'Выполнение…'

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isKbConnectionError(err: unknown): boolean {
  const text = errText(err).toLowerCase()
  return (
    text.includes('таймаут') ||
    text.includes('подключен') ||
    text.includes('связи') ||
    text.includes('websocket') ||
    text.includes('network')
  )
}

export function useEditorSession() {
  const [model, setModel] = useState<InterfaceModel>(() => createEmptyModel())
  const [baseline, setBaseline] = useState<InterfaceModel>(() =>
    createEmptyModel(),
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [history, setHistory] = useState<InterfaceModel[]>([])
  const [clipboard, setClipboard] = useState<EditorClipboard | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [interfaces, setInterfaces] = useState<ScInterfaceRef[]>([])
  const [scConnected, setScConnected] = useState(false)
  const [scBusy, setScBusy] = useState(false)
  const [scMessage, setScMessage] = useState<string | null>(KB_CONNECTING)
  const [booted, setBooted] = useState(false)

  const modelRef = useRef(model)
  modelRef.current = model
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const clipboardRef = useRef(clipboard)
  clipboardRef.current = clipboard
  const pasteCountRef = useRef(0)
  const busyRef = useRef(false)

  const changes = useMemo(
    () => diffModels(baseline, model),
    [baseline, model],
  )
  const dirty = changes.length > 0
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  const applyLoaded = useCallback((loaded: InterfaceModel) => {
    setHistory([])
    setSelectedIds([])
    setRevealId(null)
    setClipboard(null)
    pasteCountRef.current = 0
    setBaseline(cloneModel(loaded))
    setModel(loaded)
  }, [])

  const clearWorkspace = useCallback(() => {
    applyLoaded(createEmptyModel())
  }, [applyLoaded])

  const refreshList = useCallback(async () => {
    const list = await listInterfacesFromSc()
    setInterfaces(list)
    return list
  }, [])

  const persistCurrent = useCallback(async () => {
    const current = modelRef.current
    await writeModelToSc(current)
    setBaseline(cloneModel(current))
    setInterfaces((prev) => {
      const next = prev.filter((item) => item.id !== current.id)
      next.push({ id: current.id, title: current.title })
      next.sort((a, b) =>
        a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }),
      )
      return next
    })
  }, [])

  const runSc = useCallback(
    async (
      task: () => Promise<void>,
      options?: { pendingMessage?: string },
    ) => {
      if (busyRef.current) {
        return
      }
      busyRef.current = true
      setScBusy(true)
      setScMessage(options?.pendingMessage ?? KB_WORKING)
      try {
        await task()
      } catch (err) {
        if (isKbConnectionError(err)) {
          setScConnected(false)
          resetScClient()
        }
        setScMessage(errText(err))
        throw err
      } finally {
        busyRef.current = false
        setScBusy(false)
      }
    },
    [],
  )

  const boot = useCallback(async () => {
    setScMessage(KB_CONNECTING)
    await runSc(
      async () => {
        const list = await refreshList()
        setScConnected(true)
        if (list.length === 0) {
          clearWorkspace()
          setScMessage(null)
          return
        }
        const loaded = await readModelFromSc(list[0].id)
        applyLoaded(loaded)
        setScMessage(null)
      },
      { pendingMessage: KB_CONNECTING },
    ).catch(() => {
      setScConnected(false)
    })
  }, [applyLoaded, clearWorkspace, refreshList, runSc])

  const reconnect = useCallback(async () => {
    await boot()
  }, [boot])

  useEffect(() => {
    if (booted) {
      return
    }
    setBooted(true)
    void boot()
  }, [boot, booted])

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

  const hasActiveInterface = interfaces.some(
    (item) => item.id === model.id,
  )
  const hasActiveRef = useRef(hasActiveInterface)
  hasActiveRef.current = hasActiveInterface

  const save = useCallback(async () => {
    if (!scConnected) {
      setScMessage('Нет связи с БЗ')
      return
    }
    if (!hasActiveRef.current) {
      setScMessage('Сначала выберите или создайте интерфейс')
      return
    }
    try {
      await runSc(async () => {
        await persistCurrent()
        setScMessage('Сохранено')
      })
    } catch {
      /* message already set */
    }
  }, [persistCurrent, runSc, scConnected])

  const createNew = useCallback(
    async (title: string) => {
      const error = validateInterfaceTitle(title)
      if (error) {
        setScMessage(error)
        return
      }
      if (!scConnected) {
        setScMessage('Нет связи с БЗ')
        return
      }
      const normalized = normalizeInterfaceTitle(title)
      try {
        await runSc(async () => {
          if (hasActiveRef.current && dirtyRef.current) {
            await persistCurrent()
          }
          const empty = createEmptyModel(normalized)
          await writeModelToSc(empty)
          applyLoaded(empty)
          await refreshList()
          setScMessage('Создано')
        })
      } catch {
        /* message already set */
      }
    },
    [applyLoaded, persistCurrent, refreshList, runSc, scConnected],
  )

  const selectInterface = useCallback(
    async (id: string) => {
      if (!id || (hasActiveRef.current && id === modelRef.current.id)) {
        return
      }
      if (!scConnected) {
        setScMessage('Нет связи с БЗ')
        return
      }
      try {
        await runSc(async () => {
          if (hasActiveRef.current && dirtyRef.current) {
            await persistCurrent()
          }
          const loaded = await readModelFromSc(id)
          applyLoaded(loaded)
          setScMessage(null)
        })
      } catch {
        /* message already set */
      }
    },
    [applyLoaded, persistCurrent, runSc, scConnected],
  )

  const removeCurrent = useCallback(async () => {
    if (!scConnected) {
      setScMessage('Нет связи с БЗ')
      return
    }
    const current = modelRef.current
    const known = interfaces.some((item) => item.id === current.id)
    if (!known) {
      setScMessage('Интерфейс ещё не в БЗ')
      return
    }
    try {
      await runSc(async () => {
        await deleteModelFromSc(current)
        const list = await refreshList()
        if (list.length === 0) {
          clearWorkspace()
          setScMessage('Удалено')
          return
        }
        const loaded = await readModelFromSc(list[0].id)
        applyLoaded(loaded)
        setScMessage('Удалено')
      })
    } catch {
      /* message already set */
    }
  }, [
    applyLoaded,
    clearWorkspace,
    interfaces,
    refreshList,
    runSc,
    scConnected,
  ])

  const placeType = useCallback(
    (typeId: ComponentTypeId) => {
      if (!hasActiveRef.current) {
        return
      }
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
    interfaces,
    activeInterfaceId: hasActiveInterface ? model.id : '',
    hasActiveInterface,
    scConnected,
    scBusy,
    scMessage,
    canUndo: hasActiveInterface && history.length > 0,
    canCopy: hasActiveInterface && selectedIds.length > 0,
    canPaste: hasActiveInterface && clipboard !== null,
    canMoveUp:
      hasActiveInterface &&
      selected !== null &&
      layerIndex >= 0 &&
      layerIndex < layerCount - 1,
    canMoveDown: hasActiveInterface && selected !== null && layerIndex > 0,
    changes: hasActiveInterface ? changes : [],
    dirty: hasActiveInterface && dirty,
    canSave: hasActiveInterface && scConnected && dirty && !scBusy,
    canCreate: scConnected && !scBusy,
    canDelete: hasActiveInterface && scConnected && !scBusy,
    canSelect: scConnected && !scBusy && interfaces.length > 0,
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
    save,
    createNew,
    removeCurrent,
    selectInterface,
    reconnect,
  }
}
