export function shortId(id: string): string {
  const match = /_((?:cmp|lnk)_\d+)$/i.exec(id)
  if (match) {
    return `ui_..._${match[1]}`
  }
  if (id.length <= 18) {
    return id
  }
  return `${id.slice(0, 8)}...${id.slice(-6)}`
}
