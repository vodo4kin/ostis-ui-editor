import type { InterfaceModel } from '../model/types'
import { toIdtf } from '../sc/idtf'

function safeFilePart(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return cleaned || 'interface'
}

function interfaceFileName(model: InterfaceModel, ext: string): string {
  return `${safeFilePart(model.title)}__${toIdtf(model.id)}.${ext}`
}

export function scsFileName(model: InterfaceModel): string {
  return interfaceFileName(model, 'scs')
}

export function htmlFileName(model: InterfaceModel): string {
  return interfaceFileName(model, 'html')
}

export function scsZipFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `ui_interfaces_${stamp}.zip`
}
