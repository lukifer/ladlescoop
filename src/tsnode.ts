import ts from "typescript"
import {readFileSync} from "fs"

import {fileExists} from "./utils"

const keysToTypeGuards = {
  [ts.SyntaxKind.AsExpression]: ts.isAsExpression,
  [ts.SyntaxKind.EnumDeclaration]: ts.isEnumDeclaration,
  [ts.SyntaxKind.Identifier]: ts.isIdentifier,
  [ts.SyntaxKind.IndexedAccessType]: ts.isIndexedAccessTypeNode,
  [ts.SyntaxKind.LiteralType]: ts.isLiteralTypeNode,
  [ts.SyntaxKind.NullKeyword]: (x: ts.Node): x is ts.NullLiteral => x.kind === 104,
  [ts.SyntaxKind.NumericLiteral]: ts.isNumericLiteral,
  [ts.SyntaxKind.ObjectBindingPattern]: ts.isObjectBindingPattern,
  [ts.SyntaxKind.ObjectLiteralExpression]: ts.isObjectLiteralExpression,
  [ts.SyntaxKind.Parameter]: ts.isParameter,
  [ts.SyntaxKind.PropertySignature]: ts.isPropertySignature,
  [ts.SyntaxKind.StringLiteral]: ts.isStringLiteral,
  [ts.SyntaxKind.TypeLiteral]: ts.isTypeLiteralNode,
  [ts.SyntaxKind.TypeOperator]: ts.isTypeOperatorNode,
  [ts.SyntaxKind.TypeQuery]: ts.isTypeQueryNode,
  [ts.SyntaxKind.TypeReference]: ts.isTypeReferenceNode,
  [ts.SyntaxKind.UnionType]: ts.isUnionTypeNode,
  [ts.SyntaxKind.VariableDeclaration]: ts.isVariableDeclaration,
  [ts.SyntaxKind.VariableDeclarationList]: ts.isVariableDeclarationList,
} as const

export type SyntaxKind = keyof typeof keysToTypeGuards

export function getChildrenOfKind(
  el: ts.Node,
  kinds: ts.SyntaxKind[]
) {
  let children: Array<ts.Node> = []
  el?.forEachChild(child => {
    if (kinds.includes(child?.kind)) children.push(child)
  })
  return children
}

export function getNthOfKind(
  el: ts.Node,
  kind: SyntaxKind | SyntaxKind[],
  n: number
): ts.Node | undefined {
  const nth = getChildrenOfKind(el, typeof kind === 'number' ? [kind] : kind)[n]
  if (typeof kind !== 'number')
    return nth
  return nth && typedTsNode(nth, kind)
}

export function getFirstOfKind<T extends SyntaxKind>(
  el: ts.Node,
  kind: T,
) {
  const first = getNthOfKind(el, kind, 0)
  return first && typedTsNode(first, kind)
}

export function getName(el: ts.Node, n = 0) {
  const identifier = getNthOfKind(el, ts.SyntaxKind.Identifier, n)
  if (!identifier || !ts.isIdentifier(identifier)) return ''
  return identifier.escapedText || ''
}

export function traverse(el: ts.Node, path: Array<[ts.SyntaxKind, number?]>): ts.Node[] {
  const [next, ...remainder] = path
  const nodes = getChildrenOfKind(el, [next[0]])
  if (!nodes) return

  if (remainder?.length)
    return traverse(nodes[next[1] || 0], remainder)

  return nodes
}

export function findNodesOfKind(originNode: ts.Node, kinds: ts.SyntaxKind[]): ts.Node[] {
  const foundNodes: ts.Node[] = [];
  function visit(node: ts.Node) {
    if (kinds.includes(node.kind)) {
      foundNodes.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(originNode);
  return foundNodes;
}

export function getIndexedAccessType(indexedType: ts.IndexedAccessTypeNode): string | null {
  const query = getFirstOfKind(indexedType, ts.SyntaxKind.TypeQuery)
  const operator = getFirstOfKind(indexedType, ts.SyntaxKind.TypeOperator)
  if (query && operator && query.getText() === operator.type.getText()) {
    return query.exprName.getText()
  }
  return null
}

export function isExported(node: ts.Node) {
  return !!(node.modifiers?.some(m => m?.kind === ts.SyntaxKind.ExportKeyword))
}

export function isJSX(typeName: string) {
  return [
    'JSX.Element',
    'ReactElement',
    'ReactNode',
    'React.ReactElement',
    'ReaReactNode',
  ].includes(typeName)
}

export function typedTsNode<K extends keyof typeof keysToTypeGuards>(
  val: ts.Node,
  key: K,
): typeof keysToTypeGuards[K] extends (x: unknown) => x is infer R ? R : unknown {
  const typeGuard = keysToTypeGuards[key]
  if(!val) console.log({key})
  if (typeGuard && typeGuard(val)) {
    return val as typeof keysToTypeGuards[K] extends (x: unknown) => x is infer R ? R : unknown
  } else {
    return null
    // throw new Error(`Value does not match type guard for key "${key}"`)
  }
}

const sourceFileCache: Record<string, ts.SourceFile> = {}
export function getSourceFile(filePath: string): ts.SourceFile | null {
  if (!sourceFileCache[filePath]) {
    if (!/\.tsx?$/.test(filePath)) {
      if (fileExists(`${filePath}.tsx`))
        return getSourceFile(`${filePath}.tsx`)
      else if (fileExists(`${filePath}.ts`))
        return getSourceFile(`${filePath}.ts`)
      else
        return null
    }
    sourceFileCache[filePath] = ts.createSourceFile(
      filePath,
      readFileSync(filePath).toString(),
      ts.ScriptTarget.ESNext,
      true, // setParentNodes
      ts.ScriptKind.TSX
    )
  }
  return sourceFileCache[filePath]
}

export function generateDefaultObject(
  node: ts.TypeAliasDeclaration | ts.PropertySignature
): unknown {
  const typeNode = node.type
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return ""
    case ts.SyntaxKind.NumberKeyword:
      return 0
    case ts.SyntaxKind.ArrayType:
      return []
    case ts.SyntaxKind.TypeReference:
      return getName(typeNode) === 'Array' ? [] : undefined
    // case ts.SyntaxKind.FunctionType:
    //   return () => {}
    case ts.SyntaxKind.TypeLiteral:
      if (!ts.isTypeLiteralNode(typeNode)) return undefined
      return typeNode.members.reduce<Record<string, unknown>>((obj, propSig: ts.PropertySignature) => {
        const val = generateDefaultObject(propSig)
        if (val === undefined) return obj
        return {...obj, [propSig.name.getText()]: val}
      }, {})
    // default:
      // throw new Error(`Unsupported type kind: ${ts.SyntaxKind[typeNode.kind]}`)
  }
}

export function generateDefaultObjectFromInterface(interfaceDecl: ts.InterfaceDeclaration): unknown {
  const obj: Record<string, unknown> = {}
  interfaceDecl.members.forEach(member => {
    if (ts.isPropertySignature(member)) {
      const propName = member.name.getText()
      const propType = member.type!
      if (ts.isTypeAliasDeclaration(propType)) {
        obj[propName] = generateDefaultObject(propType)
      }
    }
  })
  return obj
}
