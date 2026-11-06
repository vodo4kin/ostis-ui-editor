import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import type { ComponentProps, UiComponent } from '../model/types'

type GeometryPatch = Partial<
  Pick<ComponentProps, 'x' | 'y' | 'width' | 'height'>
>

type WorkAreaProps = {
  components: UiComponent[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onGeometryLive: (id: string, patch: GeometryPatch) => void
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
      sx: number
      sy: number
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

export function WorkArea({
  components,
  selectedId,
  onSelect,
  onGeometryLive,
  onGeometryStart,
}: WorkAreaProps) {
  const dragRef = useRef<DragState | null>(null)
  const ignoreCanvasClickRef = useRef(false)

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
    onSelect(component.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'move',
      id: component.id,
      ox: e.clientX,
      oy: e.clientY,
      sx: component.props.x,
      sy: component.props.y,
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
    onSelect(component.id)
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

    const dx = e.clientX - drag.ox
    const dy = e.clientY - drag.oy
    if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      return
    }

    beginCheckpoint(drag)
    drag.moved = true

    if (drag.mode === 'move') {
      onGeometryLive(drag.id, {
        x: Math.max(0, Math.round(drag.sx + dx)),
        y: Math.max(0, Math.round(drag.sy + dy)),
      })
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

  return (
    <section className="editor-col editor-col--canvas">
      <div className="panel-head">Рабочая область</div>
      <div className="panel-body">
        <div className="work-area" onClick={onCanvasClick}>
          {sorted.length === 0 ? (
            <div className="work-area__hint">Пусто</div>
          ) : null}
          {sorted.map((component) => {
            if (!component.props.visible) {
              return null
            }
            const selected = component.id === selectedId
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
                  zIndex: selected ? 4 : 1,
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
                {selected
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
    </section>
  )
}
