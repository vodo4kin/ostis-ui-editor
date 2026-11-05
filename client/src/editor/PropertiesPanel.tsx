import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { LINK_KINDS, getCatalogEntry, labelOfType } from '../model/catalog'
import type {
  ComponentProps,
  LinkKindId,
  PropKey,
  UiComponent,
  UiLink,
} from '../model/types'
import { FIELD_SPECS } from './propFields'

type PropertiesPanelProps = {
  selected: UiComponent | null
  components: UiComponent[]
  links: UiLink[]
  onPatch: (id: string, patch: Partial<ComponentProps>) => void
  onDelete: () => void
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
  onLinkTo,
  onDropLink,
}: PropertiesPanelProps) {
  const allowed = useMemo(
    () => (selected ? getCatalogEntry(selected.typeId).allowedProps : []),
    [selected?.typeId],
  )
  const fields = useMemo(
    () => FIELD_SPECS.filter((f) => allowed.includes(f.key)),
    [allowed],
  )
  const [draft, setDraft] = useState<Draft>({})
  const propsKey = selected
    ? allowed.map((key) => String(selected.props[key])).join('|')
    : ''

  useEffect(() => {
    if (!selected) {
      setDraft({})
      return
    }
    setDraft(buildDraft(selected.props, allowed))
  }, [selected?.id, selected?.typeId, propsKey, allowed])

  if (!selected) {
    return (
      <section className="editor-col">
        <div className="panel-head">Свойства</div>
        <div className="panel-body">
          <p className="prop-empty">Элемент не выбран.</p>
        </div>
      </section>
    )
  }

  const outgoing = links.filter((l) => l.sourceId === selected.id)
  const others = components.filter((c) => c.id !== selected.id)

  function commitKey(key: PropKey) {
    if (!selected) {
      return
    }
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

        <div className="prop-block">
          <div className="prop-block__title">Связи</div>
          {outgoing.length === 0 ? (
            <p className="prop-empty">Нет исходящих связей.</p>
          ) : (
            <ul className="prop-links">
              {outgoing.map((link) => {
                const target = components.find((c) => c.id === link.targetId)
                const kindLabel =
                  LINK_KINDS.find((k) => k.id === link.kind)?.label ?? link.kind
                return (
                  <li key={link.id}>
                    <span>
                      {kindLabel} → {target?.props.name ?? link.targetId}
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
            <label className="prop-field">
              <span>добавить</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) {
                    return
                  }
                  const [kind, targetId] = value.split('::') as [
                    LinkKindId,
                    string,
                  ]
                  onLinkTo(kind, targetId)
                  e.target.value = ''
                }}
              >
                <option value="">выберите цель и вид</option>
                {LINK_KINDS.flatMap((kind) =>
                  others.map((target) => (
                    <option
                      key={`${kind.id}-${target.id}`}
                      value={`${kind.id}::${target.id}`}
                    >
                      {kind.label} → {target.props.name}
                    </option>
                  )),
                )}
              </select>
            </label>
          ) : null}
        </div>

        <button type="button" className="prop-delete" onClick={onDelete}>
          Удалить элемент
        </button>
      </div>
    </section>
  )
}
