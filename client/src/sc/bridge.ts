import type { ScClient } from 'ts-sc-client'
import type { InterfaceModel } from '../model/types'
import { connectSc } from './connection'
import {
  deleteModelFromSc as eraseModelConstruction,
  eraseInterfaceById,
} from './deleteModel'
import {
  listInterfaces,
  modelFromSc,
  type ScInterfaceRef,
} from './modelFromSc'
import { modelToScs } from './modelToScs'

export type { ScInterfaceRef }

export { connectSc }

export async function writeModelToSc(
  model: InterfaceModel,
  client?: ScClient,
): Promise<void> {
  const sc = client ?? (await connectSc())
  await eraseInterfaceById(sc, model.id)
  const scs = modelToScs(model)
  const ok = await sc.generateElementsBySCs([scs])
  if (!ok[0]) {
    throw new Error('Не удалось записать модель в БЗ')
  }
}

export async function readModelFromSc(
  modelId: string,
  client?: ScClient,
): Promise<InterfaceModel> {
  const sc = client ?? (await connectSc())
  return modelFromSc(sc, modelId)
}

export async function listInterfacesFromSc(
  client?: ScClient,
): Promise<ScInterfaceRef[]> {
  const sc = client ?? (await connectSc())
  return listInterfaces(sc)
}

export async function deleteModelFromSc(
  model: InterfaceModel,
  client?: ScClient,
): Promise<void> {
  const sc = client ?? (await connectSc())
  await eraseModelConstruction(model, sc)
}

export { modelToScs }
