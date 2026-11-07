import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import type { ComponentProps, UiComponent } from '../model/types'

type GeometryPatch = Partial<
  Pick<ComponentProps, 'x' | 'y' | 'width' | 'height'>
>

type WorkAreaProps = {
  components: UiComponent[]
  selectedIds: string[]
  revealId: string | null
  onRevealDone: () => void
  onSelect: (id: string | null, additive?: boolean) => void
  onGeometryLive: (id: string, patch: GeometryPatch) => void
  onMoveLiveMany: (items: { id: string; x: number; y: number }[]) => void
  onGeometryStart: () => void
}

type ResizeHandle =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw'

type DragState =
  | {
      mode: 'move'
      id: string
      ox: number
      oy: number
      origins: { id: string; x: number; y: number }[]
      moved: boolean
      checkpointed: boolean
    }
  | {
      mode: 'resize'
      id: string
      handle: ResizeHandle
      ox: number
      oy: number
      sx: number
      sy: number
      sw: number
      sh: number
      minW: number
      minH: number
      moved: boolean
      checkpointed: boolean
    }

const HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const ZOOM_MIN = 25
const ZOOM_MAX = 500
const ZOOM_STEP = 25
const WORLD_PAD = 48

function clampZoom(value: number): number {
  const stepped = Math.round(value / ZOOM_STEP) * ZOOM_STEP
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped))
}

function previewRadius(component: UiComponent): number {
  const preview = getCatalogEntry(component.typeId).preview
  if (preview === 'pill') {
    return Math.max(component.props.borderRadius, component.props.height / 2)
  }
  if (preview === 'rounded') {
    return Math.max(component.props.borderRadius, 6)
  }
  return component.props.borderRadius
}

function bodyStyle(component: UiComponent): CSSProperties {
  const p = component.props
  return {
    width: '100%',
    height: '100%',
    background: p.backgroundColor === 'transparent' ? 'transparent' : p.backgroundColor,
    color: p.color,
    borderStyle: p.borderStyle,
    borderWidth: p.borderStyle === 'none' ? 0 : p.borderWidth,
    borderColor: p.borderColor,
    borderRadius: previewRadius(component),
    opacity: p.opacity,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    textAlign: p.textAlign,
    padding: p.padding,
    boxSizing: 'border-box',
  }
}

function clampSize(value: number, min: number): number {
  return Math.max(min, Math.round(value))
}

function contentBounds(components: UiComponent[]): { width: number; height: number } {
  let right = 0
  let bottom = 0
  for (const component of components) {
    if (!component.props.visible) {
      continue
    }
    right = Math.max(
      right,
      component.props.x + component.props.width + component.props.margin,
    )
    bottom = Math.max(
      bottom,
      component.props.y + component.props.height + component.props.margin,
    )
  }
  return {
    width: right + WORLD_PAD,
    height: bottom + WORLD_PAD,
  }
}

export function WorkArea({
  components,
  selectedIds,
  revealId,
  onRevealDone,
  onSelect,
  onGeometryLive,
  onMoveLiveMany,
  onGeometryStart,
}: WorkAreaProps) {
  const dragRef = useRef<DragState | null>(null)
  const ignoreCanvasClickRef = useRef(false)
  const workAreaRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(1)
  const [zoom, setZoom] = useState(100)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const selectedSet = new Set(selectedIds)
  const scale = zoom / 100
  scaleRef.current = scale

  const bounds = useMemo(() => contentBounds(components), [components])
  const worldWidth = Math.max(
    bounds.width,
    viewport.width > 0 ? viewport.width / scale : 0,
  )
  const worldHeight = Math.max(
    bounds.height,
    viewport.height > 0 ? viewport.height / scale : 0,
  )

  useEffect(() => {
    const area = workAreaRef.current
    if (!area) {
      return
    }
    const update = () => {
      setViewport({
        width: area.clientWidth,
        height: area.clientHeight,
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const area = workAreaRef.current
    if (!area) {
      return
    }
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }
      event.preventDefault()
      const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setZoom((prev) => clampZoom(prev + direction))
    }
    area.addEventListener('wheel', onWheel, { passive: false })
    return () => area.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (!revealId) {
      return
    }
    const area = workAreaRef.current
    const el = area?.querySelector(
      `[data-id="${revealId}"]`,
    ) as HTMLElement | null
    if (area && el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    onRevealDone()
  }, [revealId, onRevealDone])

  const zoomOut = useCallback(() => {
    setZoom((prev) => clampZoom(prev - ZOOM_STEP))
  }, [])

  const zoomIn = useCallback(() => {
    setZoom((prev) => clampZoom(prev + ZOOM_STEP))
  }, [])

  const zoomReset = useCallback(() => {
    setZoom(100)
  }, [])

  function beginCheckpoint(drag: DragState) {
    if (!drag.checkpointed) {
      onGeometryStart()
      drag.checkpointed = true
    }
  }

  function onMovePointerDown(
    e: PointerEvent<HTMLDivElement>,
    component: UiComponent,
  ) {
    e.stopPropagation()
    const additive = e.ctrlKey || e.metaKey
    if (additive) {
      onSelect(component.id, true)
      return
    }

    const already = selectedSet.has(component.id)
    const moveIds = already && selectedIds.length > 0 ? selectedIds : [component.id]
    if (!already || selectedIds.length <= 1) {
      onSelect(component.id, false)
    }

    const origins = moveIds
      .map((id) => {
        const item = components.find((c) => c.id === id)
        if (!item) {
          return null
        }
        return { id, x: item.props.x, y: item.props.y }
      })
      .filter((item): item is { id: string; x: number; y: number } => item !== null)

    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'move',
      id: component.id,
      ox: e.clientX,
      oy: e.clientY,
      origins,
      moved: false,
      checkpointed: false,
    }
  }

  function onResizePointerDown(
    e: PointerEvent<HTMLSpanElement>,
    component: UiComponent,
    handle: ResizeHandle,
  ) {
    e.stopPropagation()
    onSelect(component.id, false)
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'resize',
      id: component.id,
      handle,
      ox: e.clientX,
      oy: e.clientY,
      sx: component.props.x,
      sy: component.props.y,
      sw: component.props.width,
      sh: component.props.height,
      minW: Math.max(16, component.props.minWidth || 16),
      minH: Math.max(16, component.props.minHeight || 16),
      moved: false,
      checkpointed: false,
    }
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || drag.id !== e.currentTarget.dataset.id) {
      return
    }

    const s = scaleRef.current || 1
    const dx = (e.clientX - drag.ox) / s
    const dy = (e.clientY - drag.oy) / s
    if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      return
    }

    beginCheckpoint(drag)
    drag.moved = true

    if (drag.mode === 'move') {
      onMoveLiveMany(
        drag.origins.map((item) => ({
          id: item.id,
          x: Math.max(0, Math.round(item.x + dx)),
          y: Math.max(0, Math.round(item.y + dy)),
        })),
      )
      return
    }

    let x = drag.sx
    let y = drag.sy
    let width = drag.sw
    let height = drag.sh
    const { handle, minW, minH } = drag

    if (handle.includes('e')) {
      width = clampSize(drag.sw + dx, minW)
    }
    if (handle.includes('s')) {
      height = clampSize(drag.sh + dy, minH)
    }
    if (handle.includes('w')) {
      width = clampSize(drag.sw - dx, minW)
      x = Math.max(0, Math.round(drag.sx + (drag.sw - width)))
    }
    if (handle.includes('n')) {
      height = clampSize(drag.sh - dy, minH)
      y = Math.max(0, Math.round(drag.sy + (drag.sh - height)))
    }

    onGeometryLive(drag.id, { x, y, width, height })
  }

  function onPointerUp(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) {
      return
    }
    if (drag.moved) {
      ignoreCanvasClickRef.current = true
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
  }

  function onCanvasClick() {
    if (ignoreCanvasClickRef.current) {
      ignoreCanvasClickRef.current = false
      return
    }
    onSelect(null)
  }

  const sorted = [...components].sort((a, b) => a.props.order - b.props.order)
  const singleSelected = selectedIds.length === 1

  return (
    <section className="editor-col editor-col--canvas">
      <div className="panel-head panel-head--split">
        <span>Рабочая область</span>
        <div className="zoom-controls" title="Ctrl + колёсико">
          <button
            type="button"
            className="zoom-controls__btn"
            disabled={zoom <= ZOOM_MIN}
            onClick={zoomOut}
            aria-label="Отдалить"
          >
            −
          </button>
          <button
            type="button"
            className="zoom-controls__value"
            onClick={zoomReset}
            title="Сбросить до 100%"
          >
            {zoom}%
          </button>
          <button
            type="button"
            className="zoom-controls__btn"
            disabled={zoom >= ZOOM_MAX}
            onClick={zoomIn}
            aria-label="Приблизить"
          >
            +
          </button>
        </div>
      </div>
      <div className="panel-body">
        <div className="work-area" ref={workAreaRef}>
          <div
            className="work-area__zoom-space"
            style={{
              width: worldWidth * scale,
              height: worldHeight * scale,
            }}
          >
            <div
              className="work-area__world"
              style={{
                width: worldWidth,
                height: worldHeight,
                transform: `scale(${scale})`,
              }}
              onClick={onCanvasClick}
            >
              {sorted.length === 0 ? (
                <div className="work-area__hint">Выберите тип слева</div>
              ) : null}
              {sorted.map((component) => {
                if (!component.props.visible) {
                  return null
                }
                const selected = selectedSet.has(component.id)
                const title = component.props.text || component.props.name
                return (
                  <div
                    key={component.id}
                    data-id={component.id}
                    className={
                      selected
                        ? 'canvas-item-wrap canvas-item-wrap--selected'
                        : 'canvas-item-wrap'
                    }
                    style={{
                      left: component.props.x,
                      top: component.props.y,
                      width: component.props.width,
                      height: component.props.height,
                      margin: component.props.margin,
                      zIndex: component.props.order,
                    }}
                    onPointerDown={(e) => onMovePointerDown(e, component)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="canvas-item__badge">
                      {labelOfType(component.typeId)}
                    </div>
                    <div className="canvas-item" style={bodyStyle(component)}>
                      <div className="canvas-item__title">{title}</div>
                    </div>
                    {selected && singleSelected
                      ? HANDLES.map((handle) => (
                          <span
                            key={handle}
                            data-id={component.id}
                            className={`canvas-handle canvas-handle--${handle}`}
                            onPointerDown={(e) =>
                              onResizePointerDown(e, component, handle)
                            }
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                          />
                        ))
                      : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
