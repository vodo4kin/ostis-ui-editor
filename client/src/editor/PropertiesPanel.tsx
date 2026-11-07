import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import type {
  ComponentProps,
  LinkKindId,
  PropKey,
  UiComponent,
  UiLink,
} from '../model/types'
import { FIELD_SPECS } from './propFields'

function componentLabel(component: UiComponent): string {
  return component.props.name || labelOfType(component.typeId)
}

type PropertiesPanelProps = {
  selected: UiComponent
  components: UiComponent[]
  links: UiLink[]
  onPatch: (id: string, patch: Partial<ComponentProps>) => void
  onDelete: () => void
  onMoveLayer: (direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
  onLinkTo: (kind: LinkKindId, targetId: string) => void
  onDropLink: (linkId: string) => void
}

type Draft = Record<string, string>

function buildDraft(props: ComponentProps, keys: PropKey[]): Draft {
  const draft: Draft = {}
  for (const key of keys) {
    draft[key] = String(props[key])
  }
  return draft
}

function parseNumber(raw: string, fallback: number): number {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return fallback
  }
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : fallback
}

export function PropertiesPanel({
  selected,
  components,
  links,
  onPatch,
  onDelete,
  onMoveLayer,
  canMoveUp,
  canMoveDown,
  onLinkTo,
  onDropLink,
}: PropertiesPanelProps) {
  const allowed = useMemo(
    () => getCatalogEntry(selected.typeId).allowedProps,
    [selected.typeId],
  )
  const fields = useMemo(
    () => FIELD_SPECS.filter((f) => allowed.includes(f.key)),
    [allowed],
  )
  const [draft, setDraft] = useState<Draft>({})
  const propsKey = allowed
    .map((key) => String(selected.props[key]))
    .join('|')

  useEffect(() => {
    setDraft(buildDraft(selected.props, allowed))
  }, [selected.id, selected.typeId, propsKey, allowed])

  const outgoing = links.filter((l) => l.sourceId === selected.id)
  const others = components.filter((c) => c.id !== selected.id)

  function commitKey(key: PropKey) {
    const spec = FIELD_SPECS.find((f) => f.key === key)
    if (!spec || spec.kind === 'checkbox') {
      return
    }

    const raw = draft[key] ?? ''
    if (spec.kind === 'number') {
      const fallback = Number(selected.props[key])
      const next = parseNumber(raw, fallback)
      setDraft((d) => ({ ...d, [key]: String(next) }))
      if (next !== selected.props[key]) {
        onPatch(selected.id, { [key]: next } as Partial<ComponentProps>)
      }
      return
    }

    if (raw !== String(selected.props[key])) {
      onPatch(selected.id, { [key]: raw } as Partial<ComponentProps>)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, key: PropKey) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      commitKey(key)
    }
  }

  return (
    <section className="editor-col">
      <div className="panel-head">Свойства</div>
      <div className="panel-body props-body">
        <label className="prop-field">
          <span>тип</span>
          <input value={labelOfType(selected.typeId)} readOnly />
        </label>
        <label className="prop-field">
          <span>id</span>
          <input value={selected.id} readOnly />
        </label>

        <div className="prop-actions">
          <button
            type="button"
            onClick={() => onMoveLayer('up')}
            disabled={!canMoveUp}
          >
            наверх
          </button>
          <button
            type="button"
            onClick={() => onMoveLayer('down')}
            disabled={!canMoveDown}
          >
            вниз
          </button>
          <button type="button" onClick={onDelete}>
            удалить
          </button>
        </div>

        {fields.map((field) => {
          if (field.kind === 'checkbox') {
            const checked = Boolean(selected.props[field.key])
            return (
              <label key={field.key} className="prop-check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    onPatch(selected.id, {
                      [field.key]: e.target.checked,
                    } as Partial<ComponentProps>)
                  }
                />
                <span>{field.label}</span>
              </label>
            )
          }

          if (field.kind === 'select') {
            return (
              <label key={field.key} className="prop-field">
                <span>{field.label}</span>
                <select
                  value={String(selected.props[field.key])}
                  onChange={(e) =>
                    onPatch(selected.id, {
                      [field.key]: e.target.value,
                    } as Partial<ComponentProps>)
                  }
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )
          }

          return (
            <label key={field.key} className="prop-field">
              <span>{field.label}</span>
              <input
                inputMode={field.kind === 'number' ? 'numeric' : undefined}
                value={draft[field.key] ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                }
                onBlur={() => commitKey(field.key)}
                onKeyDown={(e) => onKeyDown(e, field.key)}
              />
            </label>
          )
        })}

        <LinksBlock
          key={selected.id}
          outgoing={outgoing}
          others={others}
          components={components}
          onLinkTo={onLinkTo}
          onDropLink={onDropLink}
        />
      </div>
    </section>
  )
}

const TARGET_LIST_ROWS = 10

function LinksBlock({
  outgoing,
  others,
  components,
  onLinkTo,
  onDropLink,
}: {
  outgoing: UiLink[]
  others: UiComponent[]
  components: UiComponent[]
  onLinkTo: (kind: LinkKindId, targetId: string) => void
  onDropLink: (linkId: string) => void
}) {
  const [query, setQuery] = useState('')

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return others
    }
    return others.filter((item) => {
      const name = componentLabel(item).toLowerCase()
      return name.includes(q) || item.id.toLowerCase().includes(q)
    })
  }, [others, query])

  function pickTarget(targetId: string) {
    if (!targetId) {
      return
    }
    onLinkTo('contains', targetId)
    setQuery('')
  }

  return (
    <div className="prop-block">
      <div className="prop-block__title">Вложения</div>
      {outgoing.length === 0 ? (
        <p className="prop-empty">Нет вложений.</p>
      ) : (
        <ul className="prop-links">
          {outgoing.map((link) => {
            const target = components.find((c) => c.id === link.targetId)
            return (
              <li key={link.id}>
                <span className="prop-link-text">
                  {target ? componentLabel(target) : link.targetId}{' '}
                  <span className="prop-id">
                    ({target?.id ?? link.targetId})
                  </span>
                </span>
                <button type="button" onClick={() => onDropLink(link.id)}>
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {others.length > 0 ? (
        <div className="prop-link-add">
          <label className="prop-field">
            <span>поиск</span>
            <input
              type="search"
              placeholder="имя или id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="prop-field">
            <span>добавить вложение</span>
            <select
              size={TARGET_LIST_ROWS}
              className="prop-target-select"
              value=""
              onChange={(e) => {
                pickTarget(e.target.value)
                e.target.selectedIndex = -1
              }}
              onMouseDown={(e) => {
                const option = e.target
                if (!(option instanceof HTMLOptionElement)) {
                  return
                }
                if (!option.value || option.disabled) {
                  return
                }
                e.preventDefault()
                pickTarget(option.value)
              }}
            >
              {filteredTargets.length === 0 ? (
                <option value="" disabled>
                  ничего не найдено
                </option>
              ) : (
                filteredTargets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {componentLabel(target)} ({target.id})
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  )
}
