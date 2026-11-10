export {
  DEFAULT_SC_URL,
  getScClient,
  waitScOpen,
  resetScClient,
  connectSc,
} from './connection'
export {
  writeModelToSc,
  readModelFromSc,
  listInterfacesFromSc,
  deleteModelFromSc,
  modelToScs,
} from './bridge'
export type { ScInterfaceRef } from './modelFromSc'
export {
  modelFromSc,
  listInterfaces,
  listInterfaceIdtfs,
} from './modelFromSc'
export { TYPE_TO_CLASS, PROP_TO_CLASS, REL, CLASS_INTERFACE } from './names'
