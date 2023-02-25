import * as ts from "typescript"

export function getChildrenOfKind(
  el: ts.Node,
  kinds: ts.SyntaxKind[]
) {
  let children: Array<ts.Node> = []
  el.forEachChild(child => {
    if (kinds.includes(child.kind)) children.push(child)
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

export function isExported(el: ts.Node) {
  return !!(el.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))
}
