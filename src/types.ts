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

export type State = DeepReadonly<{
  componentsMap: Record<string, {
    props: Record<string, Prop>
    isDefaultExport?: boolean
  }>
  enumsMap: Record<string, Record<string, EnumVal>>
  importsMap: Record<string, string>
  importsUsed: Record<string, string>
  inputFilePath: string
  propsFormat: string
}>

export type DeepReadonly<T> =
  T extends (infer R)[] ? ReadonlyArray<DeepReadonly<R>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;

export type ArgType = Pick<LadleArgType<string | number>, 'control' | 'defaultValue' | 'name'> & {
  // This options type appears to be incorrect in Ladle
  options?: LadleArgType['control']['options']
}
export type ArgTypesMap = DeepReadonly<Record<string, ArgType>>

export type DefaultValue = boolean | number | string | string[] | null

export type EnumVal = string | number | undefined

export type Prop = {
  name: string
  kind?: ts.SyntaxKind
  type: string
  isOptional: boolean
  defaultValue?: string
  argType?: ArgType
}

export type DomTree = Array<[
  string,
  Array<[string, string?]>?
]>
