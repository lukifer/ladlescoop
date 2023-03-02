import path from "path"
import ts from "typescript"
import produce, {Draft} from "immer"

import {
  getChildrenOfKind,
  getFirstOfKind,
  getName,
  getSourceFile,
  isExported,
  traverse,
} from "./tsnode"
import {
  ArgType,
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

    typeLiteral.members.forEach(propSig => {
      if (!ts.isPropertySignature(propSig)) return
      const propName = getName(propSig)
      mutableAddProp(draft, fnName, propName, propSig.type, !!propSig.questionToken)
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

    const propSigs = getChildrenOfKind(interfaceDeclaration, [ts.SyntaxKind.PropertySignature])

    propSigs?.forEach((propSig) => {
      if (!ts.isPropertySignature(propSig) || !ts.isIdentifier(propSig.name))
        return
      const propName = propSig.name.escapedText.toString()
      mutableAddProp(draft, fnName, propName, propSig.type, !!propSig.questionToken)
    })

    return draft
  })
}

export function mutableAddProp(
  draft: Draft<State>,
  fnName: string,
  propName: string,
  typeNode: ts.TypeNode,
  isOptional: boolean,
): void {
  if (!draft.componentsMap[fnName]) {
    draft.componentsMap[fnName] = {props: {}}
  }

  const set = (p: Omit<Prop, "name" | "isOptional">): void => {
    draft.componentsMap[fnName].props[propName] = {
      ...p,
      name: propName,
      isOptional,
    }
  }

  const {kind} = typeNode
  // TODO: for optional args, use default value if present (prop.intializer)
  switch (kind) {
    case ts.SyntaxKind.UnionType:
      if (!ts.isUnionTypeNode(typeNode)) return
      if (typeNode.types.every(ts.isLiteralTypeNode)) {
        const enumKeys = typeNode.types.map(t => t.getText())
        return set({
          kind,
          type: enumKeys.join(" | "),
          argType: createArgType(enumKeys)
        })
      }
      else {
        // If union includes string or a number, we create those controls (in that order)
        if (typeNode.types.find(t => t.kind === ts.SyntaxKind.StringKeyword)) {
          return set({
            kind: ts.SyntaxKind.StringKeyword,
            type: typeNode.getText(),
            defaultValue: "''",
          })
        }
        else if (typeNode.types.find(t => t.kind === ts.SyntaxKind.NumberKeyword)) {
          return set({
            kind: ts.SyntaxKind.NumberKeyword,
            type: typeNode.getText(),
            defaultValue: '0'
          })
        }
      }
      break
    case ts.SyntaxKind.BooleanKeyword:
      return set({kind, type: "boolean", defaultValue: "false"})
    case ts.SyntaxKind.StringKeyword:
      return set({kind, type: "string", defaultValue: "''"})
    case ts.SyntaxKind.NumberKeyword:
      return set({kind, type: "number", defaultValue: "0"})
    case ts.SyntaxKind.TypeReference:
      if (!ts.isTypeReferenceNode(typeNode)) break
      const enumName = typeNode.getText()
      const propSet = {kind, type: enumName}
      if (!!draft.enumsMap[enumName]) {
        const enumKeys = Object.keys(draft.enumsMap[enumName])
        return set({
          ...propSet,
          argType: createArgType(enumKeys, enumName),
          defaultValue: `${enumName}.${enumKeys[0]}`,
        })
      }
      else if (draft.importsMap[enumName]) {
        // TODO: defaultValue / argType here
        const fullImportPath = path.resolve(path.dirname(draft.inputFilePath), draft.importsMap[enumName]);
        const sourceFile = getSourceFile(fullImportPath)
        sourceFile?.statements.forEach(statement => {
          switch (statement.kind) {
            case ts.SyntaxKind.VariableStatement:
              const objectEnum = getObjectEnumLiteral(statement)
              if (!objectEnum) break

              const [objName, objectLiteral] = objectEnum
              const objectKVs = extractObjectEnumValues(objectLiteral)
              if (Object.keys(objectKVs).length >= 2) {
                draft.enumsMap[objName] = objectKVs
              }
              break
            case ts.SyntaxKind.EnumDeclaration:
              const enumName = getName(statement)
              if (!draft.enumsMap[enumName] && ts.isEnumDeclaration(statement)) {
                draft.enumsMap[enumName] = extractEnumValues(statement)
              }
              break
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
    const enumName = getName(enumDec)
    draft.enumsMap[enumName] = extractEnumValues(enumDec)
    return draft
  })
}

export function handleObjectEnum(
  state: State,
  maybeObjectEnum: ts.VariableStatement,
): State {
  if (!isExported(maybeObjectEnum)) return state

  const objectEnum = getObjectEnumLiteral(maybeObjectEnum)
  if (!objectEnum) return state

  const [objName, objectLiteral] = objectEnum
  const objectKVs = extractObjectEnumValues(objectLiteral)
  if (Object.keys(objectKVs).length < 2)
    return state

  return produce(state, draft => {
    draft.enumsMap[objName] = objectKVs
    return draft
  })
}

export function getObjectEnumLiteral(
  maybeObjectEnum: ts.Node
): [string, ts.ObjectLiteralExpression] | null {
  const declarationList = getFirstOfKind(maybeObjectEnum, ts.SyntaxKind.VariableDeclarationList)
  if (!ts.isVariableDeclarationList(declarationList))
    return null
  const varDeclaration = getFirstOfKind(declarationList, ts.SyntaxKind.VariableDeclaration)
  if (!ts.isVariableDeclaration(varDeclaration))
    return null

  let objectLiteral = getFirstOfKind(varDeclaration, [
    ts.SyntaxKind.AsExpression,
    ts.SyntaxKind.ObjectLiteralExpression,
  ])
  if (!objectLiteral) return null
  if (!ts.isObjectLiteralExpression(objectLiteral)) { // TODO: validate "as const"?
    objectLiteral = getFirstOfKind(objectLiteral, ts.SyntaxKind.ObjectLiteralExpression)
  }
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral))
    return null

  return [getName(varDeclaration), objectLiteral]
}

export function extractEnumValues(enumDec: ts.EnumDeclaration) {
  const enumMembers = getChildrenOfKind(enumDec, [ts.SyntaxKind.EnumMember]).filter(ts.isEnumMember)
  return enumMembers.reduce<Record<string, EnumVal>>((rec, member) => {
    const memberName = ts.isIdentifier(member.name)
      ? member.name.escapedText.toString()
      : ""
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
}

export function extractObjectEnumValues(
  objectLiteral: ts.ObjectLiteralExpression,
) {
  const objectAssignments = getChildrenOfKind(objectLiteral, [
    ts.SyntaxKind.PropertyAssignment,
  ]).filter(ts.isPropertyAssignment)

  return objectAssignments.reduce<Record<string, string>>((kvs, oa) => {
    const key = getName(oa)
    const val = getFirstOfKind(oa, [
      ts.SyntaxKind.NullKeyword,
      ts.SyntaxKind.NumericLiteral,
      ts.SyntaxKind.StringLiteral,
    ])
    if (!val) return kvs

    // TODO FIXME: this throws undefined on the extractObjectEnumValues test
    // let text = val.getText()
    // let text = getName(val)
    let text = (val as any).text
    try {
      if (typeof text === "string")
        text = JSON.parse(text)
    } catch(e) {}

    return ({...kvs, [key]: text})
  }, {})
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
    draft.componentsMap[fnName] = {
      ...draft.componentsMap[fnName],
      isDefaultExport: !!fn.modifiers?.some(ts.isDefaultClause),
      hasFunction: true
    }

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
          if (!draft.importsUsed[enumName]) {
            const path = draft.importsMap[enumName] || `./${fnName}`
            draft.importsUsed[enumName] = path
          }
          if (!draft.componentsMap[fnName].props[propName]?.argType) {
            const enumKeys = Object.keys(draft.enumsMap[enumName])
            draft.componentsMap[fnName].props[propName].argType = createArgType(enumKeys, enumName)
          }
        }
        return set(`${enumName}.${getName(token, 1)}`)
    }
  })
}

export function createArgType(enumKeys: string[], prefix?: string): ArgType {
  return ({
    control: {
      type: enumKeys.length > 2 ? "select" : "radio"
    },
    options: prefix
      ? enumKeys.map(k => `${prefix}.${k}`)
      : enumKeys,
  })
}

export function handleImport(state: State, importDeclaration: ts.ImportDeclaration) {
  const namedImports = traverse(importDeclaration, [
    [ts.SyntaxKind.ImportClause, 0],
    [ts.SyntaxKind.NamedImports, 0],
    [ts.SyntaxKind.ImportSpecifier],
  ])
  const importPath = getFirstOfKind(importDeclaration, ts.SyntaxKind.StringLiteral)
  return produce(state, draft => {
    namedImports?.forEach(namedImport => {
      const importName = getName(namedImport)
      draft.importsMap[importName] = importPath.getText().slice(1, -1)
    })
    return draft
  })
}
