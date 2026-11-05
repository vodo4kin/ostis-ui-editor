import { useCallback, useRef, useState } from 'react'
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
  removeComponent,
  removeLink,
  updateComponentProps,
} from './modelOps'

const HISTORY_LIMIT = 50

export function useEditorSession() {
  const [model, setModel] = useState<InterfaceModel>(() => createEmptyModel())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [history, setHistory] = useState<InterfaceModel[]>([])
  const modelRef = useRef(model)
  modelRef.current = model
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

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
    setHistory([])
    setSelectedId(null)
    setModel(createEmptyModel())
  }, [])

  const placeType = useCallback(
    (typeId: ComponentTypeId) => {
      setModel((prev) => {
        const { model: next, componentId } = addComponent(prev, typeId)
        setSelectedId(componentId)
        return commit(prev, next)
      })
    },
    [commit],
  )

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
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

  const deleteSelected = useCallback(() => {
    const id = selectedIdRef.current
    if (!id) {
      return
    }
    setSelectedId(null)
    setModel((prev) => commit(prev, removeComponent(prev, id)))
  }, [commit])

  const linkTo = useCallback(
    (kind: LinkKindId, targetId: string) => {
      const id = selectedIdRef.current
      if (!id) {
        return
      }
      setModel((prev) => commit(prev, addLink(prev, kind, id, targetId)))
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
      setSelectedId((cur) =>
        cur && prev.components.some((c) => c.id === cur) ? cur : null,
      )
      return h.slice(0, -1)
    })
  }, [])

  const selected =
    model.components.find((c) => c.id === selectedId) ?? null

  return {
    model,
    selected,
    selectedId,
    canUndo: history.length > 0,
    createNew,
    placeType,
    select,
    patchProps,
    patchPropsLive,
    pushCheckpoint,
    deleteSelected,
    linkTo,
    dropLink,
    undo,
  }
}
