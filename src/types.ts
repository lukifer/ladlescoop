import {ArgType as LadleArgType} from "@ladle/react"
import ts from "typescript"

export type State = DeepReadonly<{
  enumsMap: Record<string, Record<string, EnumVal>>
  enumsImport: string[]
  componentsMap: Record<string, {
    props: Record<string, Prop>
    // definition: ts.FunctionDeclaration | null,
    isDefaultExport?: boolean
  }>
}>

export type DeepReadonly<T> =
  T extends (infer R)[] ? ReadonlyArray<DeepReadonly<R>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;

export type ArgType = Pick<LadleArgType<string | number>, 'control' | 'defaultValue' | 'name'>
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
