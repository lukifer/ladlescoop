import ts from "typescript"
import produce, {Draft} from "immer"

import {
  getChildrenOfKind,
  getFirstOfKind,
  getName,
  isExported,
  traverse,
} from "./tsnode"
import {
  DefaultValue,
  EnumVal,
  Prop,
  State,
} from "./types"
import {warn} from "./utils"

export function getFnFromProps(format: string, propsName: string) {
  const reg = new RegExp("^"+format.replace("{Component}", "([A-Z][a-zA-Z0-9_]+)")+"$")
  const match = reg.exec(propsName)
  return match?.length && match[1]
}

export function handleType(state: State, typeDeclaration: ts.TypeAliasDeclaration): State {
  return produce(state, draft => {
    const propsName = getName(typeDeclaration)
    const fnName = getFnFromProps(state.propsFormat, propsName)
    if (!fnName) return state

    const typeLiteral = getFirstOfKind(typeDeclaration, ts.SyntaxKind.TypeLiteral)
    if (!typeLiteral || !ts.isTypeLiteralNode(typeLiteral)) return state

    typeLiteral.members.forEach(prop => {
      mutableAddProp(draft, fnName, prop)
    })
    return draft
  })
}

export function handleInterface(
  state: State,
  interfaceDeclaration: ts.InterfaceDeclaration
): State {
  return produce(state, draft => {
    const propsName = getName(interfaceDeclaration)
    const fnName = getFnFromProps(state.propsFormat, propsName)
    if (!fnName) return state

    const props = getChildrenOfKind(interfaceDeclaration, [ts.SyntaxKind.PropertySignature])

    props?.forEach((prop) => {
      mutableAddProp(draft, fnName, prop)
    })

    return draft
  })
}

export function mutableAddProp(
  draft: Draft<State>,
  fnName: string,
  prop: ts.Node,
): void {
  if (
       !ts.isPropertySignature(prop)
    || !ts.isIdentifier(prop.name)
    || !ts.isTypeNode(prop.type)
  ) return

  const propName = prop.name.escapedText.toString()
  if (!draft.componentsMap[fnName]) {
    draft.componentsMap[fnName] = {props: {}}
  }

  const set = (p: Pick<Prop, "kind" | "type" | "argType">): void => {
    draft.componentsMap[fnName].props[propName] = {
      ...p,
      name: propName,
      isOptional: !!prop.questionToken
    }
  }

  const typeNode = prop.type
  const {kind} = typeNode
  switch (kind) {
    case ts.SyntaxKind.UnionType:
      if (!ts.isUnionTypeNode(typeNode)) return
      if (typeNode.types.every(ts.isLiteralTypeNode)) {
        return set({
          kind,
          type: typeNode.types.map(t => t.getText()).join(" | "),
          argType: {
            control: {
              options: typeNode.types.map(t => t.getText()),
              type: typeNode.types.length > 2 ? "select" : "radio",
            },
          }
        })
      }
      else {
        // If union includes number or a string, we create those controls (in that order)
        const numType = typeNode.types.find(t => t.kind === ts.SyntaxKind.NumberKeyword)
        const strType = typeNode.types.find(t => t.kind === ts.SyntaxKind.StringKeyword)
        if (numType) {
          return set({
            kind: ts.SyntaxKind.NumberKeyword,
            type: typeNode.getText(),
          })
        }
        else if (strType) {
          return set({
            kind: ts.SyntaxKind.StringKeyword,
            type: typeNode.getText(),
          })
        }
      }
      break
    case ts.SyntaxKind.BooleanKeyword:
      return set({kind, type: "boolean"})
    case ts.SyntaxKind.StringKeyword:
      return set({kind, type: "string"})
    case ts.SyntaxKind.NumberKeyword:
      return set({kind, type: "number"})
    case ts.SyntaxKind.TypeReference:
      if (!ts.isTypeReferenceNode) return
      const enumName = typeNode.getText()
      const propSet = {kind, type: enumName}
      if (draft.enumsMap[enumName]) {
        return set({
          ...propSet,
          argType: {
            control: {
              options: Object.keys(draft.enumsMap[enumName]).map(e => `${enumName}.${e}`),
              type: "select", // TODO: radio, inline-radio
            },
          }
        })
      }
      return set(propSet)
  }
}

export function handleEnum(
  state: State,
  enumDec: ts.EnumDeclaration
): State {
  if (!isExported(enumDec)) return state
  return produce(state, draft => {
    const enumMembers = getChildrenOfKind(enumDec, [ts.SyntaxKind.EnumMember]).filter(ts.isEnumMember)
    draft.enumsMap[getName(enumDec)] = enumMembers.reduce<Record<string, EnumVal>>((rec, member) => {
      const memberName = ts.isIdentifier(member.name) ? member.name.escapedText.toString() : ""
      if (!memberName) return rec

      const literal: ts.Node | undefined = getFirstOfKind(member, [
        ts.SyntaxKind.NumericLiteral,
        ts.SyntaxKind.StringLiteral,
      ])
      const valText = literal && (
        ts.isNumericLiteral(literal) || ts.isStringLiteral(literal)
      ) && literal.text
      return {...rec, [memberName]: valText}
    }, {})
    return draft
  })
}

export function handleFunction(
  state: State,
  fn: ts.FunctionDeclaration
): State {
  const fnName = getName(fn)
  if (!/^([A-Z][a-zA-Z0-9_]+)/.test(fnName) || !state.componentsMap[fnName])
    return state

  return produce(state, draft => {
    if (!isExported(fn)) warn(`Warning: Component ${fnName} is not exported`)
    draft.componentsMap[fnName].isDefaultExport = !!fn.modifiers?.some(ts.isDefaultClause)

    const propsParam = getFirstOfKind(fn, ts.SyntaxKind.Parameter)
    const objectBinding = getFirstOfKind(propsParam, ts.SyntaxKind.ObjectBindingPattern)
    getChildrenOfKind(objectBinding, [ts.SyntaxKind.BindingElement]).forEach((bind) => {
      if (!ts.isBindingElement(bind)) return false
      mutableAddPropBinding(draft, fnName, bind)
    })
    return draft
  })
}

export function mutableAddPropBinding(
  draft: Draft<State>,
  fnName: string,
  bind: ts.BindingElement
): void {
  const propName = getName(bind)
  bind.forEachChild(token => {
    const set = (val: DefaultValue) => {
      if (draft.componentsMap[fnName].props[propName]) {
        draft.componentsMap[fnName].props[propName].defaultValue = `${val}`
      }
    }
    if (bind.getChildCount() === 1) {
      const prop = draft.componentsMap[fnName].props[propName]
      if (prop.kind === ts.SyntaxKind.NumberKeyword)
        return set("0")
      else if (prop.kind === ts.SyntaxKind.StringKeyword)
        return set("''")
    }
    switch (token.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return set(parseInt(token.getText()))
      case ts.SyntaxKind.TypeReference:
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.StringLiteral:
        return set(token.getText())
      case ts.SyntaxKind.NullKeyword:
        return set(null)
      case ts.SyntaxKind.TrueKeyword:
        return set(true)
      case ts.SyntaxKind.FalseKeyword:
        return set(false)
      case ts.SyntaxKind.PropertyAccessExpression:
        if (!ts.isPropertyAccessExpression(token)) return
        const enumName = getName(token)
        if (draft.enumsMap[enumName]) {
          draft.enumsImport.push(enumName)
        }
        return set(`${enumName}.${getName(token, 1)}`)
    }
  })
}

export function handleImport(state: State, importDeclaration: ts.ImportDeclaration) {
  const namedImports = traverse(importDeclaration, [
    [ts.SyntaxKind.ImportClause, 0],
    [ts.SyntaxKind.NamedImports, 0],
    [ts.SyntaxKind.ImportSpecifier],
  ])
  const path = getFirstOfKind(importDeclaration, ts.SyntaxKind.StringLiteral)
  return produce(state, draft => {
    namedImports?.forEach(namedImport => {
      const importName = getName(namedImport)
      draft.importsMap[importName] = path.getText()
    })
    return draft
  })
}
