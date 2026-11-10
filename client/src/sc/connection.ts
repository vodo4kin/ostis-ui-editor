import { ScClient, ScType } from 'ts-sc-client'

export const DEFAULT_SC_URL = 'ws://127.0.0.1:8090/ws_json'

let shared: ScClient | null = null

export function getScClient(url = DEFAULT_SC_URL): ScClient {
  if (!shared) {
    shared = new ScClient(url)
  }
  return shared
}

export function resetScClient(): void {
  shared = null
}

export async function waitScOpen(
  client: ScClient,
  timeoutMs = 10000,
): Promise<void> {
  const ping = client
    .resolveKeynodes([{ id: 'concept_ui_interface', type: new ScType() }])
    .then((map) => {
      if (!map.concept_ui_interface?.isValid()) {
        throw new Error('В БЗ нет схемы UI — пересобери базу')
      }
    })

  await Promise.race([
    ping,
    new Promise<never>((_, reject) => {
      globalThis.setTimeout(() => {
        reject(new Error('Таймаут подключения к БЗ'))
      }, timeoutMs)
    }),
  ])
}

export async function connectSc(url?: string): Promise<ScClient> {
  const client = getScClient(url)
  try {
    await waitScOpen(client)
    return client
  } catch (err) {
    resetScClient()
    throw err
  }
}
