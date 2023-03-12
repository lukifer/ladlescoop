import ts from "typescript"
import produce, {Draft} from "immer"

import {
  generateDefaultObject,
  getChildrenOfKind,
  getFirstOfKind,
  getIndexedAccessType,
  getName,
  getNthOfKind,
  getSourceFile,
  isExported,
  isJSX,
  traverse,
} from "./tsnode"
import {
  ArgType,
  DefaultValue,
  EnumsMap,
  EnumVal,
  Prop,
  State,
} from "./types"
import {
  getFileName,
  getFullPath,
  newEmptyComponent,
} from "./utils"

export function getComponentNameFromProps(format: string, propsName: string) {
  const reg = new RegExp("^"+format.replace("{Component}", "([A-Z][a-zA-Z0-9_]+)")+"$")
  const match = reg.exec(propsName)
  return match?.length && match[1]
}

export function handleType(state: State, typeDeclaration: ts.TypeAliasDeclaration): State {
  return produce(state, draft => {
    const typeName = getName(typeDeclaration)
    const componentName = getComponentNameFromProps(state.propsFormat, typeName)

    if (componentName) {
      const typeLiteral = getFirstOfKind(typeDeclaration, ts.SyntaxKind.TypeLiteral)
      typeLiteral?.members?.forEach(propSig => {
        if (!ts.isPropertySignature(propSig)) return
        const propName = getName(propSig)
        mutableAddPropsType(draft, componentName, propName, propSig.type, !!propSig.questionToken)
      })
      return draft
    }

    else { // non-props type
      draft.complexMap[typeName] = generateDefaultObject(typeDeclaration)
      draft.importsMap[typeName] = `./${getFileName(draft.inputFilePath)}`
    }
  })
}

export function handleInterface(
  state: State,
  interfaceDeclaration: ts.InterfaceDeclaration
): State {
  return produce(state, draft => {
    const propsName = getName(interfaceDeclaration)
    const componentName = getComponentNameFromProps(state.propsFormat, propsName)
    if (!componentName) return state

    const propSigs = getChildrenOfKind(interfaceDeclaration, [ts.SyntaxKind.PropertySignature])

    propSigs?.forEach((propSig) => {
      if (!ts.isPropertySignature(propSig) || !ts.isIdentifier(propSig.name))
        return
      const propName = propSig.name.escapedText.toString()
      mutableAddPropsType(draft, componentName, propName, propSig.type, !!propSig.questionToken)
    })

    return draft
  })
}

export function mutableAddPropsType(
  draft: Draft<State>,
  componentName: string,
  propName: string,
  typeNode: ts.TypeNode,
  isOptional: boolean,
): void {
  if (!draft.componentsMap[componentName]) {
    draft.componentsMap[componentName] = newEmptyComponent()
  }

  // FIXME: when running tests, TypeError: Cannot read property 'text' of undefined
  let type = ""
  try {type = typeNode.getText()} catch(e) {}

  const set = (p: Partial<Omit<Prop, "name" | "isOptional">>): void => {
    draft.componentsMap[componentName].props[propName] = {
      type,
      kind: typeNode.kind,
      name: propName,
      isOptional,
      ...p,
    }
  }

  if (propName === "children") {
    draft.componentsMap[componentName].hasChildren = true
    return
  }

  const {kind} = typeNode
  // TODO: for optional args, use default value if present (prop.intializer)
  switch (kind) {
    case ts.SyntaxKind.UnionType:
      if (!ts.isUnionTypeNode(typeNode)) return
      if (typeNode.types.every(ts.isLiteralTypeNode)) {
        const enumKeys = typeNode.types.map(t => t.getText())
        return set({
          type: enumKeys.join(" | "),
          argType: createArgType(enumKeys)
        })
      }
      else {
        // If union includes string or a number, we create those controls (in that order)
        if (typeNode.types.find(t => t.kind === ts.SyntaxKind.StringKeyword)) {
          return set({
            kind: ts.SyntaxKind.StringKeyword,
            defaultValue: "''",
          })
        }
        else if (typeNode.types.find(t => t.kind === ts.SyntaxKind.NumberKeyword)) {
          return set({
            kind: ts.SyntaxKind.NumberKeyword,
            defaultValue: "0",
          })
        }
      }
      break
    case ts.SyntaxKind.BooleanKeyword:
      return set({type: "boolean", defaultValue: "false"})
    case ts.SyntaxKind.StringKeyword:
      return set({type: "string", defaultValue: "''"})
    case ts.SyntaxKind.NumberKeyword:
      return set({type: "number", defaultValue: "0"})
    case ts.SyntaxKind.FunctionType:
      return set({argType: {action: propName}})
    case ts.SyntaxKind.IndexedAccessType:
      if (!ts.isIndexedAccessTypeNode(typeNode)) return
      const objName = getIndexedAccessType(typeNode)
      if (objName) {
        mutableAddToImports(draft, componentName, objName)
        return set({})
      }
      break
    case ts.SyntaxKind.ArrayType:
    case ts.SyntaxKind.TypeReference:
      const node = typeNode.kind === ts.SyntaxKind.ArrayType
        ? getFirstOfKind(typeNode, ts.SyntaxKind.TypeReference)
        : typeNode
      if (!ts.isTypeReferenceNode(node)) break
      if (isJSX(typeNode.getText())) {
        return set({defaultValue: "<></>"})
      }

      const indexedType = getFirstOfKind(node, ts.SyntaxKind.IndexedAccessType)
      const typeName = getIndexedAccessType(indexedType) || node.getText()

      if (!!draft.enumsMap[typeName]) {
        const enumKeys = Object.keys(draft.enumsMap[typeName])
        mutableAddToImports(draft, componentName, typeName)
        return set({
          argType: createArgType(enumKeys, typeName, "multi-select"),
        })
      }
      else if (draft.importsMap[typeName]) {
        // TODO: defaultValue / argType
        if (draft.complexMap[typeName]) {
          mutableAddToImports(draft, componentName, typeName)
          return set({
            defaultValue: `${JSON.stringify(draft.complexMap[typeName])}`,
          })
        }
        else {
          const importPath = draft.importsMap[typeName]
          draft.enumsMap = {
            ...draft.enumsMap,
            ...importEnumsFromFile(draft.inputFilePath, importPath)
          }
        }
      }
      return set({})
  }
}

export function importEnumsFromFile(
  inputFilePath: string,
  relativeImportPath: string
): EnumsMap {
  const fullImportPath = getFullPath(inputFilePath, relativeImportPath)
  const sourceFile = getSourceFile(fullImportPath)

  const addToEnumsMap: EnumsMap = {}
  sourceFile?.statements.forEach(statement => {
    switch (statement.kind) {
      case ts.SyntaxKind.VariableStatement:
        const objectEnum = getObjectEnumLiteral(statement)
        if (!objectEnum) break

        const [objName, objectLiteral] = objectEnum
        const objectKVs = extractObjectEnumValues(objectLiteral)
        if (Object.keys(objectKVs).length >= 2) {
          addToEnumsMap[objName] = objectKVs
        }
        break
      case ts.SyntaxKind.EnumDeclaration:
        const enumName = getName(statement)
        if (!ts.isEnumDeclaration(statement)) break
        addToEnumsMap[enumName] = extractEnumValues(statement)
        break
    }
  })
  return addToEnumsMap
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
  const varDeclaration = getFirstOfKind(declarationList, ts.SyntaxKind.VariableDeclaration)

  const asExpression = getFirstOfKind(varDeclaration, ts.SyntaxKind.AsExpression)
  let objectLiteral = getFirstOfKind(asExpression || varDeclaration, ts.SyntaxKind.ObjectLiteralExpression)
  if (!objectLiteral) return null

  return [getName(varDeclaration), objectLiteral]
}

export function extractEnumValues(enumDec: ts.EnumDeclaration) {
  const enumMembers = getChildrenOfKind(enumDec, [ts.SyntaxKind.EnumMember]).filter(ts.isEnumMember)
  return enumMembers.reduce<Record<string, EnumVal>>((rec, member) => {
    const memberName = ts.isIdentifier(member.name)
      ? member.name.escapedText.toString()
      : ""
    if (!memberName) return rec

    const num = getFirstOfKind(member, ts.SyntaxKind.NumericLiteral)
    const str = getFirstOfKind(member, ts.SyntaxKind.StringLiteral)
    const valText = num?.text || str?.text
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
    const val = getNthOfKind(oa, [
      ts.SyntaxKind.NullKeyword,
      ts.SyntaxKind.NumericLiteral,
      ts.SyntaxKind.StringLiteral,
    ], 0)
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
  fn: ts.FunctionDeclaration | ts.ArrowFunction
): State {
  const fnName = getName(fn) || getName(fn.parent)
  if (!/^([A-Z][a-zA-Z0-9_]+)/.test(fnName))
  if (!state.componentsMap[fnName] && fnName !== getFileName(state.inputFilePath))
    return state

  return produce(state, draft => {
    draft.componentsMap[fnName] = {
      ...(draft.componentsMap[fnName] || newEmptyComponent()),
      isDefaultExport: !!fn.modifiers?.some(m => m?.kind === ts.SyntaxKind.DefaultKeyword),
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
  componentName: string,
  bind: ts.BindingElement
): void {
  const propName = getName(bind)
  bind.forEachChild(token => {
    const set = (val: DefaultValue) => {
      if (draft.componentsMap[componentName].props[propName]) {
        draft.componentsMap[componentName].props[propName].defaultValue = `${val}`
      }
    }
    if (bind.getChildCount() === 1) {
      const prop = draft.componentsMap[componentName].props[propName]
      if (prop?.kind === ts.SyntaxKind.NumberKeyword)
        return set("0")
      else if (prop?.kind === ts.SyntaxKind.StringKeyword)
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
          mutableAddToImports(draft, componentName, enumName)
          if (!draft.componentsMap[componentName].props[propName]?.argType) {
            const enumKeys = Object.keys(draft.enumsMap[enumName])
            const argType = createArgType(enumKeys, enumName)
            draft.componentsMap[componentName].props[propName] = {
              ...draft.componentsMap[componentName].props[propName],
              argType,
            }
          }
        }
        return set(`${enumName}.${getName(token, 1)}`)
    }
  })
}

export function mutableAddToImports(
  draft: Draft<State>,
  componentName: string,
  importName: string
) {
  if (!draft.componentsMap[componentName].importsUsed[importName]) {
    const path = draft.importsMap[importName] || `./${getFileName(draft.inputFilePath)}`
    draft.componentsMap[componentName].importsUsed[importName] = path
  }
}

export function createArgType(
  enumKeys: string[],
  prefix?: string,
  controlType?: ArgType["control"]["type"]
): ArgType {
  return ({
    control: {
      type: controlType || (enumKeys.length > 2 ? "select" : "radio")
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
