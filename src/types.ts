import {ArgType as LadleArgType} from "@ladle/react"
import ts from "typescript"

// To test imports within AST
export enum ExportedFontSize {
  small = "0.8rem",
  medium = "1rem",
  large = "1.2rem",
}
export enum ExportedButIgnored {
  small = "0.8rem",
  medium = "1rem",
  large = "1.2rem",
}
export const ExportedFontWeightObj = {
  normal: "400",
  bold: "700",
} as const
export const EXPORTED_MAX_VALUE = 1000

export type Component = {
  hasChildren?: boolean
  hasFunction?: boolean
  importsUsed: Record<string, string>
  isDefaultExport?: boolean
  props: Record<string, Prop>
}

export type EnumsMap = Record<string, Record<string, EnumVal>>

export type State = DeepReadonly<{
  complexMap: Record<string, unknown>
  componentsMap: Record<string, Component>
  enumsMap: EnumsMap
  importsMap: Record<string, string>
  inputFilePath: string
  propsFormat: string
}>

export type DeepReadonly<T> =
  T extends (infer R)[] ? ReadonlyArray<DeepReadonly<R>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;

type LadleArgTypeKeys = 'action' | 'control' | 'defaultValue' | 'name'
export type ArgType = Pick<LadleArgType<string | number>, LadleArgTypeKeys> & {
  // This options type appears to be incorrect in Ladle
  options?: LadleArgType['control']['options']
}
export type ArgTypesMap = DeepReadonly<Record<string, ArgType>>

export type DefaultValue = boolean | number | string | string[] | null

export type EnumVal = string | number | undefined

export type Prop = {
  argType?: ArgType
  defaultValue?: string
  isOptional: boolean
  kind?: ts.SyntaxKind
  name: string
  type: string
}

export type DomTree = Array<[
  string,
  Array<[string, string?]>?
]>
