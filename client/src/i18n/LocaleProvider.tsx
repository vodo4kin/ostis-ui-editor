import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getLocale,
  setLocale,
  subscribeLocale,
  t as translate,
  toggleLocale,
  type Locale,
  type MessageKey,
  type MessageParams,
} from './core'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => Locale
  t: (key: MessageKey, params?: MessageParams) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale())

  useEffect(() => subscribeLocale(setLocaleState), [])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: translate,
    }),
    [locale],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale requires LocaleProvider')
  }
  return ctx
}

export function useT(): LocaleContextValue['t'] {
  return useLocale().t
}
