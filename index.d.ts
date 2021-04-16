import { types } from "recast"

export type AnyType = {
  [key: string]: any,
}
export type InstanceBody = Map<string, types.namedTypes.TSMethodSignature>
