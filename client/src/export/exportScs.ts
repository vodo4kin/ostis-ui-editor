import type { InterfaceModel } from '../model/types'
import { modelToScs } from '../sc/modelToScs'
import { downloadBlob } from './downloadBlob'
import { scsFileName, scsZipFileName } from './fileNames'
import { buildZipStore } from './zipStore'

function scsBlob(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' })
}

export function exportModelAsScsFile(model: InterfaceModel): void {
  downloadBlob(scsBlob(modelToScs(model)), scsFileName(model))
}

export function exportModelsAsScsZip(models: InterfaceModel[]): void {
  if (models.length === 0) {
    throw new Error('Нет интерфейсов для экспорта')
  }

  const usedNames = new Set<string>()
  const encoder = new TextEncoder()
  const entries = models.map((model) => {
    let name = scsFileName(model)
    if (usedNames.has(name)) {
      name = `${model.id}.scs`
    }
    usedNames.add(name)
    return {
      name,
      data: encoder.encode(modelToScs(model)),
    }
  })

  downloadBlob(buildZipStore(entries), scsZipFileName())
}
