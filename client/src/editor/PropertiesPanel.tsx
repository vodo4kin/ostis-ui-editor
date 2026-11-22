import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react'
import { useT } from '../i18n'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import {
  LIMITS,
  formatCharCount,
  normalizePropValue,
  stringPropMaxLength,
} from '../model/limits'
import { shortId } from '../model/shortId'
import type {
  ComponentProps,
  LinkKindId,
  PropKey,
  UiComponent,
  UiLink,
} from '../model/types'
import { FIELD_SPECS, PROP_GROUPS } from './propFields'

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
  const t = useT()
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
      const parsed = parseNumber(raw, fallback)
      const next = normalizePropValue(key, parsed as never) as number
      setDraft((d) => ({ ...d, [key]: String(next) }))
      if (next !== selected.props[key]) {
        onPatch(selected.id, { [key]: next } as Partial<ComponentProps>)
      }
      return
    }

    const next = normalizePropValue(key, raw as never) as string
    setDraft((d) => ({ ...d, [key]: next }))
    if (next !== String(selected.props[key])) {
      onPatch(selected.id, { [key]: next } as Partial<ComponentProps>)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, key: PropKey) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      commitKey(key)
    }
  }

  function renderField(key: PropKey) {
    const field = fields.find((item) => item.key === key)
    if (!field) {
      return null
    }

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
          <span>{t(field.labelKey)}</span>
        </label>
      )
    }

    if (field.kind === 'select') {
      return (
        <label key={field.key} className="prop-field">
          <span>{t(field.labelKey)}</span>
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
                {opt.labelKey ? t(opt.labelKey) : (opt.label ?? opt.value)}
              </option>
            ))}
          </select>
        </label>
      )
    }

    const numberRange =
      field.kind === 'number'
        ? LIMITS.numberProp[field.key as keyof typeof LIMITS.numberProp]
        : undefined
    const maxLength =
      field.kind === 'text' ? stringPropMaxLength(field.key) : undefined
    const draftValue = draft[field.key] ?? ''

    return (
      <label key={field.key} className="prop-field">
        <span className="prop-field__head">
          <span>{t(field.labelKey)}</span>
          {maxLength != null ? (
            <span className="char-count">
              {formatCharCount(draftValue.length, maxLength)}
            </span>
          ) : null}
        </span>
        <input
          inputMode={field.kind === 'number' ? 'numeric' : undefined}
          value={draftValue}
          min={numberRange?.min}
          max={numberRange?.max}
          maxLength={maxLength}
          onChange={(e) =>
            setDraft((d) => ({ ...d, [field.key]: e.target.value }))
          }
          onBlur={() => commitKey(field.key)}
          onKeyDown={(e) => onKeyDown(e, field.key)}
        />
      </label>
    )
  }

  const grouped = PROP_GROUPS.map((group) => ({
    ...group,
    keys: group.keys.filter((key) => allowed.includes(key)),
  })).filter((group) => group.keys.length > 0)

  return (
    <section className="editor-col editor-col--props">
      <div className="panel-head">{t('props.title')}</div>
      <div className="panel-body props-body">
        <label className="prop-field">
          <span>{t('props.type')}</span>
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
            {t('props.bringForward')}
          </button>
          <button
            type="button"
            onClick={() => onMoveLayer('down')}
            disabled={!canMoveDown}
          >
            {t('props.sendBackward')}
          </button>
          <button type="button" onClick={onDelete}>
            {t('props.delete')}
          </button>
        </div>

        {grouped.map((group) => (
          <div key={group.id} className="prop-block">
            <div className="prop-block__title">{t(group.labelKey)}</div>
            <div className="prop-group">{group.keys.map(renderField)}</div>
          </div>
        ))}

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
  const t = useT()
  const [query, setQuery] = useState('')
  const linkedTargets = useMemo(
    () => new Set(outgoing.map((link) => link.targetId)),
    [outgoing],
  )

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return others
    }
    return others.filter((item) => {
      const name = componentLabel(item).toLowerCase()
      return (
        name.includes(q) ||
        item.id.toLowerCase().includes(q) ||
        shortId(item.id).toLowerCase().includes(q)
      )
    })
  }, [others, query])

  function pickTarget(targetId: string) {
    if (!targetId || linkedTargets.has(targetId)) {
      return
    }
    onLinkTo('contains', targetId)
    setQuery('')
  }

  return (
    <div className="prop-block">
      <div className="prop-block__title">{t('props.contains')}</div>
      {outgoing.length === 0 ? (
        <p className="prop-empty">{t('props.containsEmpty')}</p>
      ) : (
        <ul className="prop-links">
          {outgoing.map((link) => {
            const target = components.find((c) => c.id === link.targetId)
            return (
              <li key={link.id}>
                <span className="prop-link-text">
                  {target ? componentLabel(target) : shortId(link.targetId)}{' '}
                  <span className="prop-id">
                    ({shortId(target?.id ?? link.targetId)})
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
            <span>{t('props.search')}</span>
            <input
              type="search"
              placeholder={t('props.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="prop-field">
            <span>{t('props.addContains')}</span>
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
                  {t('props.nothingFound')}
                </option>
              ) : (
                filteredTargets.map((target) => {
                  const linked = linkedTargets.has(target.id)
                  return (
                    <option
                      key={target.id}
                      value={target.id}
                      disabled={linked}
                    >
                      {componentLabel(target)} ({shortId(target.id)})
                      {linked ? t('props.alreadyAdded') : ''}
                    </option>
                  )
                })
              )}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  )
}
