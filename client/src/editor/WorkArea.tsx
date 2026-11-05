import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import type { UiComponent } from '../model/types'

type WorkAreaProps = {
  components: UiComponent[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMoveLive: (id: string, x: number, y: number) => void
  onMoveStart: () => void
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

export function WorkArea({
  components,
  selectedId,
  onSelect,
  onMoveLive,
  onMoveStart,
}: WorkAreaProps) {
  const dragRef = useRef<{
    id: string
    ox: number
    oy: number
    sx: number
    sy: number
    moved: boolean
    checkpointed: boolean
  } | null>(null)
  const ignoreCanvasClickRef = useRef(false)

  function onPointerDown(
    e: PointerEvent<HTMLDivElement>,
    component: UiComponent,
  ) {
    e.stopPropagation()
    onSelect(component.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: component.id,
      ox: e.clientX,
      oy: e.clientY,
      sx: component.props.x,
      sy: component.props.y,
      moved: false,
      checkpointed: false,
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.id !== e.currentTarget.dataset.id) {
      return
    }

    const dx = e.clientX - drag.ox
    const dy = e.clientY - drag.oy
    if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      return
    }

    if (!drag.checkpointed) {
      onMoveStart()
      drag.checkpointed = true
    }
    drag.moved = true

    const x = Math.max(0, Math.round(drag.sx + dx))
    const y = Math.max(0, Math.round(drag.sy + dy))
    onMoveLive(drag.id, x, y)
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) {
      return
    }
    if (drag.moved) {
      ignoreCanvasClickRef.current = true
    }
    e.currentTarget.releasePointerCapture(e.pointerId)
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
                onPointerDown={(e) => onPointerDown(e, component)}
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
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
