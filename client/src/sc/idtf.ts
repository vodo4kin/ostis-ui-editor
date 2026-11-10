export function toIdtf(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, '_')
  if (!cleaned) {
    return 'node'
  }
  if (/^[0-9]/.test(cleaned)) {
    return `n_${cleaned}`
  }
  return cleaned
}

export function escapeScsContent(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/]/g, '\\]')
}
