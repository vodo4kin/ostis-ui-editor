import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react'
import { useT } from '../i18n'
import { getCatalogEntry, labelOfType } from '../model/catalog'
import {
  canLink,
  linkKindsForSource,
} from '../model/linkRules'
import {
  LIMITS,
  formatCharCount,
  normalizePropValue,
  stringPropMaxLength,
} from '../model/limits'
import { shortId } from '../model/shortId'
import type {
  ComponentProps,
  ComponentTypeId,
  LinkKindId,
  PropKey,
  UiComponent,
  UiLink,
} from '../model/types'
import type { MessageKey } from '../i18n'
import { FIELD_SPECS, PROP_GROUPS } from './propFields'

function componentLabel(component: UiComponent): string {
  return component.props.name || labelOfType(component.typeId)
}

const MULTI_SKIP = new Set<PropKey>([
  'name',
  'text_value',
  'tooltip',
  'action_id',
  'order',
])

type PropertiesPanelProps = {
  selection: UiComponent[]
  components: UiComponent[]
  links: UiLink[]
  onPatch: (ids: string[], patch: Partial<ComponentProps>) => void
  onDelete: () => void
  onMoveLayer: (direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
  onLinkTo: (kind: LinkKindId, targetId: string) => void
  onDropLink: (linkId: string) => void
}

type Draft = Record<string, string>

function sharedValue(
  selection: UiComponent[],
  key: PropKey,
): { mixed: boolean; value: string } {
  const first = String(selection[0].props[key])
  for (let i = 1; i < selection.length; i += 1) {
    if (String(selection[i].props[key]) !== first) {
      return { mixed: true, value: '' }
    }
  }
  return { mixed: false, value: first }
}

function buildDraft(
  selection: UiComponent[],
  keys: PropKey[],
): Draft {
  const draft: Draft = {}
  for (const key of keys) {
    const shared = sharedValue(selection, key)
    draft[key] = shared.mixed ? '' : shared.value
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
  selection,
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
  const multi = selection.length > 1
  const selected = selection[0]
  const selectedIds = selection.map((item) => item.id)

  const allowed = useMemo(() => {
    if (selection.length === 0) {
      return [] as PropKey[]
    }
    let keys = new Set(getCatalogEntry(selection[0].typeId).allowedProps)
    for (let i = 1; i < selection.length; i += 1) {
      const next = new Set(getCatalogEntry(selection[i].typeId).allowedProps)
      keys = new Set([...keys].filter((key) => next.has(key)))
    }
    if (multi) {
      keys = new Set([...keys].filter((key) => !MULTI_SKIP.has(key)))
    }
    return [...keys]
  }, [multi, selection])

  const fields = useMemo(
    () => FIELD_SPECS.filter((f) => allowed.includes(f.key)),
    [allowed],
  )
  const [draft, setDraft] = useState<Draft>({})
  const selectionKey = selection
    .map((item) => item.id)
    .join(',')
  const propsKey = allowed
    .map((key) => selection.map((item) => String(item.props[key])).join('~'))
    .join('|')

  useEffect(() => {
    if (selection.length === 0) {
      setDraft({})
      return
    }
    setDraft(buildDraft(selection, allowed))
  }, [selectionKey, propsKey, allowed, selection])

  const linkKinds =
    !multi && selected ? linkKindsForSource(selected.typeId) : []

  function commitKey(key: PropKey) {
    const spec = FIELD_SPECS.find((f) => f.key === key)
    if (!spec || spec.kind === 'checkbox') {
      return
    }

    const raw = draft[key] ?? ''
    if (raw === '' && sharedValue(selection, key).mixed) {
      return
    }

    if (spec.kind === 'number') {
      const fallback = Number(selection[0].props[key])
      const parsed = parseNumber(raw, fallback)
      const next = normalizePropValue(key, parsed as never) as number
      setDraft((d) => ({ ...d, [key]: String(next) }))
      onPatch(selectedIds, { [key]: next } as Partial<ComponentProps>)
      return
    }

    const next = normalizePropValue(key, raw as never) as string
    setDraft((d) => ({ ...d, [key]: next }))
    onPatch(selectedIds, { [key]: next } as Partial<ComponentProps>)
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

    const shared = sharedValue(selection, field.key)

    if (field.kind === 'checkbox') {
      return (
        <label key={field.key} className="prop-check">
          <input
            type="checkbox"
            checked={!shared.mixed && shared.value === 'true'}
            ref={(el) => {
              if (el) {
                el.indeterminate = shared.mixed
              }
            }}
            onChange={(e) =>
              onPatch(selectedIds, {
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
            value={shared.mixed ? '' : shared.value}
            onChange={(e) =>
              onPatch(selectedIds, {
                [field.key]: e.target.value,
              } as Partial<ComponentProps>)
            }
          >
            {shared.mixed ? (
              <option value="" disabled>
                {t('props.mixed')}
              </option>
            ) : null}
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
          placeholder={shared.mixed ? t('props.mixed') : undefined}
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

  if (!selected) {
    return null
  }

  return (
    <section className="editor-col editor-col--props">
      <div className="panel-head">
        {multi
          ? t('props.multiTitle', { count: selection.length })
          : t('props.title')}
      </div>
      <div className="panel-body props-body">
        {multi ? null : (
          <>
            <label className="prop-field">
              <span>{t('props.type')}</span>
              <input value={labelOfType(selected.typeId)} readOnly />
            </label>
            <label className="prop-field">
              <span>id</span>
              <input value={selected.id} readOnly />
            </label>
          </>
        )}

        <div className="prop-actions">
          {multi ? null : (
            <>
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
            </>
          )}
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

        {multi
          ? null
          : linkKinds.map((kind) => (
              <LinksBlock
                key={`${selected.id}:${kind}`}
                kind={kind}
                sourceType={selected.typeId}
                sourceId={selected.id}
                links={links}
                components={components}
                onLinkTo={onLinkTo}
                onDropLink={onDropLink}
              />
            ))}
      </div>
    </section>
  )
}

const TARGET_LIST_ROWS = 10

const LINK_UI: Record<
  LinkKindId,
  {
    title: MessageKey
    empty: MessageKey
    add: MessageKey
  }
> = {
  contains: {
    title: 'props.contains',
    empty: 'props.containsEmpty',
    add: 'props.addContains',
  },
  input_target: {
    title: 'props.input_target',
    empty: 'props.input_targetEmpty',
    add: 'props.addInputTarget',
  },
  output_target: {
    title: 'props.output_target',
    empty: 'props.output_targetEmpty',
    add: 'props.addOutputTarget',
  },
}

function LinksBlock({
  kind,
  sourceType,
  sourceId,
  links,
  components,
  onLinkTo,
  onDropLink,
}: {
  kind: LinkKindId
  sourceType: ComponentTypeId
  sourceId: string
  links: UiLink[]
  components: UiComponent[]
  onLinkTo: (kind: LinkKindId, targetId: string) => void
  onDropLink: (linkId: string) => void
}) {
  const t = useT()
  const labels = LINK_UI[kind]
  const [query, setQuery] = useState('')
  const outgoing = useMemo(
    () =>
      links.filter((link) => link.kind === kind && link.sourceId === sourceId),
    [kind, links, sourceId],
  )
  const linkedTargets = useMemo(
    () => new Set(outgoing.map((link) => link.targetId)),
    [outgoing],
  )
  const candidates = useMemo(
    () =>
      components.filter(
        (item) =>
          item.id !== sourceId && canLink(kind, sourceType, item.typeId),
      ),
    [components, kind, sourceId, sourceType],
  )

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return candidates
    }
    return candidates.filter((item) => {
      const name = componentLabel(item).toLowerCase()
      return (
        name.includes(q) ||
        item.id.toLowerCase().includes(q) ||
        shortId(item.id).toLowerCase().includes(q)
      )
    })
  }, [candidates, query])

  function pickTarget(targetId: string) {
    if (!targetId || linkedTargets.has(targetId)) {
      return
    }
    onLinkTo(kind, targetId)
    setQuery('')
  }

  return (
    <div className="prop-block">
      <div className="prop-block__title">{t(labels.title)}</div>
      {outgoing.length === 0 ? (
        <p className="prop-empty">{t(labels.empty)}</p>
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
      {candidates.length > 0 ? (
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
            <span>{t(labels.add)}</span>
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
