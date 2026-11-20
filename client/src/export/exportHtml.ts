import type { InterfaceModel } from '../model/types'
import { downloadBlob } from './downloadBlob'
import { htmlFileName } from './fileNames'

export function exportHtmlFile(html: string, model: InterfaceModel): void {
  downloadBlob(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    htmlFileName(model),
  )
}
