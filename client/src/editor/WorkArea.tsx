import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { useT } from '../i18n'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import type { ComponentProps, UiComponent, UiLink } from '../model/types'
import { expandWithDescendants } from '../model/containsRelations'
import {
  boundsOfRects,
  clampGroupBox,
  clampGroupMoveDelta,
  transformGroupResize,
  type RectOrigin,
} from '../model/geometry'

type GeometryPatch = Partial<
  Pick<ComponentProps, 'x' | 'y' | 'width' | 'height'>
>

type WorkAreaProps = {
  components: UiComponent[]
  links: UiLink[]
  selectedIds: string[]
  revealId: string | null
  onRevealDone: () => void
  onSelect: (id: string | null, additive?: boolean) => void
  onSelectMany: (ids: string[], additive?: boolean) => void
  onGeometryLive: (id: string, patch: GeometryPatch) => void
  onMoveLiveMany: (items: { id: string; x: number; y: number }[]) => void
  onGeometryLiveMany: (
    items: { id: string; patch: GeometryPatch }[],
  ) => void
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
  | {
      mode: 'group-resize'
      id: string
      handle: ResizeHandle
      ox: number
      oy: number
      box: { x: number; y: number; width: number; height: number }
      origins: RectOrigin[]
      minSize: number
      moved: boolean
      checkpointed: boolean
    }
  | {
      mode: 'marquee'
      ox: number
      oy: number
      x: number
      y: number
      additive: boolean
      moved: boolean
    }

const GROUP_RESIZE_MIN = 32

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
    return component.props.height / 2
  }
  return component.props.corner_radius
}

function bodyStyle(component: UiComponent): CSSProperties {
  const p = component.props
  return {
    width: '100%',
    height: '100%',
    background: p.background_color === 'transparent' ? 'transparent' : p.background_color,
    color: p.color,
    borderStyle: p.border_style,
    borderWidth: p.border_style === 'none' ? 0 : p.border_width,
    borderColor: p.border_color,
    borderRadius: previewRadius(component),
    opacity: p.opacity,
    fontSize: p.font_size,
    fontWeight: p.font_weight,
    textAlign: p.text_align,
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

function normalizeRect(ax: number, ay: number, bx: number, by: number) {
  return {
    left: Math.min(ax, bx),
    top: Math.min(ay, by),
    right: Math.max(ax, bx),
    bottom: Math.max(ay, by),
  }
}

function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  )
}

export function WorkArea({
  components,
  links,
  selectedIds,
  revealId,
  onRevealDone,
  onSelect,
  onSelectMany,
  onGeometryLive,
  onMoveLiveMany,
  onGeometryLiveMany,
  onGeometryStart,
}: WorkAreaProps) {
  const t = useT()
  const dragRef = useRef<DragState | null>(null)
  const ignoreCanvasClickRef = useRef(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const workAreaRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(1)
  const [zoom, setZoom] = useState(100)
  const [showTypeLabels, setShowTypeLabels] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [marquee, setMarquee] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const selectedSet = new Set(selectedIds)
  const scale = zoom / 100
  scaleRef.current = scale

  const bounds = useMemo(() => contentBounds(components), [components])
  const multiSelected = selectedIds.length > 1
  const groupBox = useMemo(() => {
    if (!multiSelected) {
      return null
    }
    const rects = selectedIds
      .map((id) => components.find((c) => c.id === id))
      .filter((c): c is UiComponent => Boolean(c?.props.visible))
      .map((c) => ({
        x: c.props.x,
        y: c.props.y,
        width: c.props.width,
        height: c.props.height,
      }))
    return boundsOfRects(rects)
  }, [components, multiSelected, selectedIds])
  const worldWidth = Math.max(
    bounds.width,
    viewport.width > 0 ? Math.floor(viewport.width / scale) : 0,
  )
  const worldHeight = Math.max(
    bounds.height,
    viewport.height > 0 ? Math.floor(viewport.height / scale) : 0,
  )

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) {
      return
    }
    const update = () => {
      const width = Math.round(shell.clientWidth)
      const height = Math.round(shell.clientHeight)
      setViewport((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(shell)
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

  function clientToWorld(clientX: number, clientY: number) {
    const world = worldRef.current
    if (!world) {
      return { x: 0, y: 0 }
    }
    const rect = world.getBoundingClientRect()
    const s = scaleRef.current || 1
    return {
      x: (clientX - rect.left) / s,
      y: (clientY - rect.top) / s,
    }
  }

  function beginCheckpoint(drag: DragState) {
    if (drag.mode === 'marquee') {
      return
    }
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
    const seedIds =
      already && selectedIds.length > 0 ? selectedIds : [component.id]
    if (!already || selectedIds.length <= 1) {
      onSelect(component.id, false)
    }

    const moveIds = expandWithDescendants(components, links, seedIds)
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
      minW: Math.max(16, component.props.min_width || 16),
      minH: Math.max(16, component.props.min_height || 16),
      moved: false,
      checkpointed: false,
    }
  }

  function onGroupResizePointerDown(
    e: PointerEvent<HTMLSpanElement>,
    handle: ResizeHandle,
  ) {
    e.stopPropagation()
    const moveIds = expandWithDescendants(components, links, selectedIds)
    const origins: RectOrigin[] = []
    for (const id of moveIds) {
      const item = components.find((c) => c.id === id)
      if (!item) {
        continue
      }
      origins.push({
        id,
        x: item.props.x,
        y: item.props.y,
        width: item.props.width,
        height: item.props.height,
      })
    }
    const box = boundsOfRects(origins)
    if (!box || origins.length === 0) {
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'group-resize',
      id: 'group-resize',
      handle,
      ox: e.clientX,
      oy: e.clientY,
      box,
      origins,
      minSize: GROUP_RESIZE_MIN,
      moved: false,
      checkpointed: false,
    }
  }

  function onWorldPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) {
      return
    }
    if (e.target !== e.currentTarget) {
      return
    }
    const point = clientToWorld(e.clientX, e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'marquee',
      ox: point.x,
      oy: point.y,
      x: point.x,
      y: point.y,
      additive: e.ctrlKey || e.metaKey,
      moved: false,
    }
    setMarquee({ left: point.x, top: point.y, width: 0, height: 0 })
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) {
      return
    }

    if (drag.mode === 'marquee') {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
        return
      }
      const point = clientToWorld(e.clientX, e.clientY)
      const dx = point.x - drag.ox
      const dy = point.y - drag.oy
      if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        return
      }
      drag.moved = true
      drag.x = point.x
      drag.y = point.y
      const box = normalizeRect(drag.ox, drag.oy, drag.x, drag.y)
      setMarquee({
        left: box.left,
        top: box.top,
        width: box.right - box.left,
        height: box.bottom - box.top,
      })
      return
    }

    if (drag.id !== e.currentTarget.dataset.id) {
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
      const clamped = clampGroupMoveDelta(drag.origins, dx, dy)
      onMoveLiveMany(
        drag.origins.map((item) => ({
          id: item.id,
          x: Math.round(item.x + clamped.dx),
          y: Math.round(item.y + clamped.dy),
        })),
      )
      return
    }

    if (drag.mode === 'group-resize') {
      const { handle, box, minSize } = drag
      let next = { ...box }
      if (handle.includes('e')) {
        next.width = Math.max(minSize, box.width + dx)
      }
      if (handle.includes('s')) {
        next.height = Math.max(minSize, box.height + dy)
      }
      if (handle.includes('w')) {
        const width = Math.max(minSize, box.width - dx)
        next.x = box.x + (box.width - width)
        next.width = width
      }
      if (handle.includes('n')) {
        const height = Math.max(minSize, box.height - dy)
        next.y = box.y + (box.height - height)
        next.height = height
      }
      next = clampGroupBox(next, minSize)
      const transformed = transformGroupResize(
        drag.origins,
        box,
        next,
        16,
      )
      onGeometryLiveMany(
        transformed.map((item) => ({
          id: item.id,
          patch: {
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          },
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

  function finishMarquee(drag: Extract<DragState, { mode: 'marquee' }>) {
    setMarquee(null)
    if (!drag.moved) {
      if (!drag.additive) {
        onSelect(null)
      }
      return
    }
    const box = normalizeRect(drag.ox, drag.oy, drag.x, drag.y)
    const hit = components
      .filter((component) => {
        if (!component.props.visible) {
          return false
        }
        const p = component.props
        return rectsIntersect(box, {
          left: p.x,
          top: p.y,
          right: p.x + p.width,
          bottom: p.y + p.height,
        })
      })
      .map((component) => component.id)
    onSelectMany(hit, drag.additive)
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
    if (drag.mode === 'marquee') {
      finishMarquee(drag)
    }
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
        <span>{t('workArea.title')}</span>
        <div className="work-area-tools">
          <label className="work-area-tools__check">
            <input
              type="checkbox"
              checked={showTypeLabels}
              onChange={(e) => setShowTypeLabels(e.target.checked)}
            />
            {t('workArea.showType')}
          </label>
          <label className="work-area-tools__check">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            {t('workArea.showGrid')}
          </label>
          <div className="zoom-controls" title={t('workArea.zoomHint')}>
            <button
              type="button"
              className="zoom-controls__btn"
              disabled={zoom <= ZOOM_MIN}
              onClick={zoomOut}
              aria-label={t('workArea.zoomOut')}
            >
              −
            </button>
            <button
              type="button"
              className="zoom-controls__value"
              onClick={zoomReset}
              title={t('workArea.zoomReset')}
            >
              {zoom}%
            </button>
            <button
              type="button"
              className="zoom-controls__btn"
              disabled={zoom >= ZOOM_MAX}
              onClick={zoomIn}
              aria-label={t('workArea.zoomIn')}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div className="panel-body panel-body--canvas">
        <div className="work-area-shell" ref={shellRef}>
          <div className="work-area" ref={workAreaRef}>
            <div
              className="work-area__zoom-space"
              style={{
                width: worldWidth * scale,
                height: worldHeight * scale,
              }}
            >
              <div
                ref={worldRef}
                className={
                  showGrid
                    ? 'work-area__world'
                    : 'work-area__world work-area__world--plain'
                }
                style={{
                  width: worldWidth,
                  height: worldHeight,
                  transform: `scale(${scale})`,
                }}
                onPointerDown={onWorldPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onClick={onCanvasClick}
              >
                {sorted.length === 0 ? (
                  <div className="work-area__hint">{t('workArea.hint')}</div>
                ) : null}
                {sorted.map((component) => {
                  if (!component.props.visible) {
                    return null
                  }
                  const selected = selectedSet.has(component.id)
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
                      {showTypeLabels ? (
                        <div className="canvas-item__badge">
                          {labelOfType(component.typeId)}
                        </div>
                      ) : null}
                      <div className="canvas-item" style={bodyStyle(component)}>
                        <div className="canvas-item__title">
                          {component.props.text_value}
                        </div>
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
                {groupBox ? (
                  <div
                    className="canvas-group-frame"
                    data-id="group-resize"
                    style={{
                      left: groupBox.x,
                      top: groupBox.y,
                      width: groupBox.width,
                      height: groupBox.height,
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  >
                    {HANDLES.map((handle) => (
                      <span
                        key={handle}
                        data-id="group-resize"
                        className={`canvas-handle canvas-handle--${handle}`}
                        onPointerDown={(e) =>
                          onGroupResizePointerDown(e, handle)
                        }
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                      />
                    ))}
                  </div>
                ) : null}
                {marquee ? (
                  <div
                    className="work-area__marquee"
                    style={{
                      left: marquee.left,
                      top: marquee.top,
                      width: marquee.width,
                      height: marquee.height,
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
