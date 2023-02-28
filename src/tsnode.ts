import ts from "typescript"
import {readFileSync} from "fs"

import {fileExists} from "./utils"

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
  kind: ts.SyntaxKind | ts.SyntaxKind[],
  n: number
): ts.Node | undefined {
  return getChildrenOfKind(el, typeof kind === 'number' ? [kind] : kind)[n]
}

export function getFirstOfKind(
  el: ts.Node,
  kind: ts.SyntaxKind | ts.SyntaxKind[]
): ts.Node | undefined {
  return getNthOfKind(el, typeof kind === 'number' ? [kind] : kind, 0)
}

export function getName(el: ts.Node, n = 0) {
  const identifier = getNthOfKind(el, ts.SyntaxKind.Identifier, n)
  if (!ts.isIdentifier(identifier)) return ''
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

export function isExported(el: ts.Node) {
  return !!(el.modifiers?.some(m => m?.kind === ts.SyntaxKind.ExportKeyword))
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
