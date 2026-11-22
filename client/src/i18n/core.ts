import { en, type MessageKey } from './en'
import { ru } from './ru'

export type Locale = 'en' | 'ru'
export type { MessageKey }

export type MessageParams = Record<string, string | number>

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en: en as Record<MessageKey, string>,
  ru,
}

const STORAGE_KEY = 'ostis-ui-editor.locale'
const DEFAULT_LOCALE: Locale = 'en'

type Listener = (locale: Locale) => void

const listeners = new Set<Listener>()

function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'en' || raw === 'ru') {
      return raw
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

let currentLocale: Locale = readStoredLocale()

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) {
    return
  }
  currentLocale = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  for (const listener of listeners) {
    listener(locale)
  }
}

export function toggleLocale(): Locale {
  const next: Locale = currentLocale === 'en' ? 'ru' : 'en'
  setLocale(next)
  return next
}

export function subscribeLocale(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function hasMessage(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, key)
}

function format(template: string, params?: MessageParams): string {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : `{${name}}`,
  )
}

export function t(key: MessageKey, params?: MessageParams): string {
  const catalog = catalogs[currentLocale] ?? catalogs.en
  return format(catalog[key] ?? catalogs.en[key] ?? key, params)
}

export function resolveMessage(
  message: string | null | undefined,
  params?: MessageParams,
): string {
  if (!message) {
    return ''
  }
  if (hasMessage(message)) {
    return t(message, params)
  }
  return message
}
