import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  exportModelAsScsFile,
  exportModelsAsScsZip,
  type ExportFormat,
  type ExportScope,
} from '../export'
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
  duplicateModel,
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
  const [future, setFuture] = useState<InterfaceModel[]>([])
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
  const historyRef = useRef(history)
  historyRef.current = history
  const futureRef = useRef(future)
  futureRef.current = future
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
    historyRef.current = []
    futureRef.current = []
    setHistory([])
    setFuture([])
    setSelectedIds([])
    setRevealId(null)
    setClipboard(null)
    pasteCountRef.current = 0
    setBaseline(cloneModel(loaded))
    setModel(loaded)
  }, [])

  const pushUndoSnapshot = useCallback((snapshot: InterfaceModel) => {
    const stack = [...historyRef.current, snapshot]
    if (stack.length > HISTORY_LIMIT) {
      stack.shift()
    }
    historyRef.current = stack
    futureRef.current = []
    setHistory(stack)
    setFuture([])
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
    pushUndoSnapshot(structuredClone(modelRef.current))
  }, [pushUndoSnapshot])

  const commit = useCallback(
    (prev: InterfaceModel, next: InterfaceModel) => {
      if (next === prev) {
        return prev
      }
      pushUndoSnapshot(structuredClone(prev))
      return next
    },
    [pushUndoSnapshot],
  )

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
      const error = validateInterfaceTitle(title, interfaces)
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
          const empty = createEmptyModel(
            normalized,
            interfaces.map((item) => item.id),
          )
          await writeModelToSc(empty)
          applyLoaded(empty)
          await refreshList()
          setScMessage('Создано')
        })
      } catch {
        /* message already set */
      }
    },
    [
      applyLoaded,
      interfaces,
      persistCurrent,
      refreshList,
      runSc,
      scConnected,
    ],
  )

  const renameCurrent = useCallback(
    async (title: string) => {
      if (!hasActiveRef.current) {
        return
      }
      const current = modelRef.current
      const error = validateInterfaceTitle(title, interfaces, current.id)
      if (error) {
        setScMessage(error)
        return
      }
      if (!scConnected) {
        setScMessage('Нет связи с БЗ')
        return
      }
      const normalized = normalizeInterfaceTitle(title)
      if (normalized === normalizeInterfaceTitle(current.title)) {
        setScMessage(null)
        return
      }
      try {
        await runSc(async () => {
          const next = { ...current, title: normalized }
          await writeModelToSc(next)
          applyLoaded(next)
          await refreshList()
          setScMessage('Переименовано')
        })
      } catch {
        /* message already set */
      }
    },
    [applyLoaded, interfaces, refreshList, runSc, scConnected],
  )

  const duplicateCurrent = useCallback(
    async (title: string) => {
      if (!hasActiveRef.current) {
        return
      }
      const error = validateInterfaceTitle(title, interfaces)
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
          if (dirtyRef.current) {
            await persistCurrent()
          }
          const source = modelRef.current
          const copy = duplicateModel(
            source,
            normalized,
            interfaces.map((item) => item.id),
          )
          await writeModelToSc(copy)
          applyLoaded(copy)
          await refreshList()
          setScMessage('Дублировано')
        })
      } catch {
        /* message already set */
      }
    },
    [
      applyLoaded,
      interfaces,
      persistCurrent,
      refreshList,
      runSc,
      scConnected,
    ],
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

  const exportInterfaces = useCallback(
    async (scope: ExportScope, format: ExportFormat) => {
      if (format !== 'scs') {
        setScMessage('Этот формат пока не поддерживается')
        return
      }
      if (!scConnected) {
        setScMessage('Нет связи с БЗ')
        return
      }
      if (scope === 'current' && !hasActiveRef.current) {
        setScMessage('Сначала выберите интерфейс')
        return
      }

      try {
        await runSc(async () => {
          if (hasActiveRef.current && dirtyRef.current) {
            await persistCurrent()
          }

          if (scope === 'current') {
            const loaded = await readModelFromSc(modelRef.current.id)
            exportModelAsScsFile(loaded)
            setScMessage('Экспортировано')
            return
          }

          const list = await refreshList()
          if (list.length === 0) {
            throw new Error('Нет интерфейсов для экспорта')
          }
          const models: InterfaceModel[] = []
          for (const item of list) {
            models.push(await readModelFromSc(item.id))
          }
          exportModelsAsScsZip(models)
          setScMessage('Экспортировано')
        })
      } catch {
        /* message already set */
      }
    },
    [persistCurrent, refreshList, runSc, scConnected],
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
      if (busyRef.current || !hasActiveRef.current) {
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
    if (busyRef.current) {
      return
    }
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

  const selectAll = useCallback(() => {
    if (busyRef.current || !hasActiveRef.current) {
      return
    }
    setSelectedIds(modelRef.current.components.map((item) => item.id))
  }, [])

  const clearSelection = useCallback(() => {
    if (busyRef.current) {
      return
    }
    setSelectedIds([])
  }, [])

  const patchProps = useCallback(
    (componentId: string, patch: Partial<ComponentProps>) => {
      if (busyRef.current) {
        return
      }
      setModel((prev) =>
        commit(prev, updateComponentProps(prev, componentId, patch)),
      )
    },
    [commit],
  )

  const patchPropsLive = useCallback(
    (componentId: string, patch: Partial<ComponentProps>) => {
      if (busyRef.current) {
        return
      }
      setModel((prev) => updateComponentProps(prev, componentId, patch))
    },
    [],
  )

  const patchPropsLiveMany = useCallback(
    (items: { id: string; patch: Partial<ComponentProps> }[]) => {
      if (busyRef.current || items.length === 0) {
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

  const pushCheckpointGuarded = useCallback(() => {
    if (busyRef.current) {
      return
    }
    pushCheckpoint()
  }, [pushCheckpoint])

  const deleteSelected = useCallback(() => {
    if (busyRef.current) {
      return
    }
    const ids = selectedIdsRef.current
    if (ids.length === 0) {
      return
    }
    setSelectedIds([])
    setModel((prev) => commit(prev, removeComponents(prev, ids)))
  }, [commit])

  const moveSelectedLayer = useCallback(
    (direction: 'up' | 'down') => {
      if (busyRef.current) {
        return
      }
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
    if (busyRef.current) {
      return
    }
    const clip = takeClipboard(modelRef.current, selectedIdsRef.current)
    if (!clip) {
      return
    }
    pasteCountRef.current = 0
    setClipboard(clip)
  }, [])

  const cutSelected = useCallback(() => {
    if (busyRef.current) {
      return
    }
    const ids = selectedIdsRef.current
    const clip = takeClipboard(modelRef.current, ids)
    if (!clip) {
      return
    }
    pasteCountRef.current = 0
    setClipboard(clip)
    setSelectedIds([])
    setModel((prev) => commit(prev, removeComponents(prev, ids)))
  }, [commit])

  const pasteFromClipboard = useCallback(() => {
    if (busyRef.current) {
      return
    }
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

  const duplicateSelected = useCallback(() => {
    if (busyRef.current) {
      return
    }
    const clip = takeClipboard(modelRef.current, selectedIdsRef.current)
    if (!clip) {
      return
    }
    setModel((prev) => {
      const { model: next, newIds } = pasteClipboard(prev, clip, 24)
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
      if (busyRef.current) {
        return
      }
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
      if (busyRef.current) {
        return
      }
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
      if (busyRef.current) {
        return
      }
      setModel((prev) => commit(prev, removeLink(prev, linkId)))
    },
    [commit],
  )

  const undo = useCallback(() => {
    if (busyRef.current) {
      return
    }
    const stack = historyRef.current
    if (stack.length === 0) {
      return
    }
    const prev = stack[stack.length - 1]
    const nextHistory = stack.slice(0, -1)
    const nextFuture = [
      ...futureRef.current,
      structuredClone(modelRef.current),
    ]
    if (nextFuture.length > HISTORY_LIMIT) {
      nextFuture.shift()
    }
    historyRef.current = nextHistory
    futureRef.current = nextFuture
    setHistory(nextHistory)
    setFuture(nextFuture)
    setModel(prev)
    setSelectedIds((cur) =>
      cur.filter((id) => prev.components.some((c) => c.id === id)),
    )
  }, [])

  const redo = useCallback(() => {
    if (busyRef.current) {
      return
    }
    const stack = futureRef.current
    if (stack.length === 0) {
      return
    }
    const next = stack[stack.length - 1]
    const nextFuture = stack.slice(0, -1)
    const nextHistory = [
      ...historyRef.current,
      structuredClone(modelRef.current),
    ]
    if (nextHistory.length > HISTORY_LIMIT) {
      nextHistory.shift()
    }
    historyRef.current = nextHistory
    futureRef.current = nextFuture
    setHistory(nextHistory)
    setFuture(nextFuture)
    setModel(next)
    setSelectedIds((cur) =>
      cur.filter((id) => next.components.some((c) => c.id === id)),
    )
  }, [])

  const revertModelChange = useCallback(
    (change: ModelChange) => {
      if (busyRef.current) {
        return
      }
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
    canUndo: hasActiveInterface && history.length > 0 && !scBusy,
    canRedo: hasActiveInterface && future.length > 0 && !scBusy,
    canCopy: hasActiveInterface && selectedIds.length > 0 && !scBusy,
    canPaste: hasActiveInterface && clipboard !== null && !scBusy,
    canMoveUp:
      hasActiveInterface &&
      !scBusy &&
      selected !== null &&
      layerIndex >= 0 &&
      layerIndex < layerCount - 1,
    canMoveDown:
      hasActiveInterface && !scBusy && selected !== null && layerIndex > 0,
    changes: hasActiveInterface ? changes : [],
    dirty: hasActiveInterface && dirty,
    canSave: hasActiveInterface && scConnected && dirty && !scBusy,
    canCreate: scConnected && !scBusy,
    canRename: hasActiveInterface && scConnected && !scBusy,
    canDuplicate: hasActiveInterface && scConnected && !scBusy,
    canDelete: hasActiveInterface && scConnected && !scBusy,
    canExport:
      scConnected &&
      !scBusy &&
      (hasActiveInterface || interfaces.length > 0),
    canExportCurrent: hasActiveInterface && scConnected && !scBusy,
    canExportAll:
      scConnected &&
      !scBusy &&
      (interfaces.length > 0 || hasActiveInterface),
    canSelect: scConnected && !scBusy && interfaces.length > 0,
    placeType,
    select,
    selectAll,
    clearSelection,
    patchProps,
    patchPropsLive,
    patchPropsLiveMany,
    pushCheckpoint: pushCheckpointGuarded,
    deleteSelected,
    moveSelectedLayer,
    copySelected,
    cutSelected,
    pasteFromClipboard,
    duplicateSelected,
    clearReveal,
    nudgeSelected,
    linkTo,
    dropLink,
    undo,
    redo,
    revertModelChange,
    save,
    createNew,
    renameCurrent,
    duplicateCurrent,
    exportInterfaces,
    removeCurrent,
    selectInterface,
    reconnect,
  }
}
