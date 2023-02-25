import * as ts from "typescript"

import {handleEnum} from "../src/parseComponent"
import {State} from "../src/types"

const {factory} = ts

const emptyState: State = {
  enumsMap: {},
  enumsImport: [],
  componentsMap: {},
}

describe("parseComponent", () => {
  it("adds exported enum to map", () => {
    const mockEnum = factory.createEnumDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      'Taco',
      [
        ts.factory.createEnumMember('HardShell'),
        ts.factory.createEnumMember('SoftShell'),
      ]
    )
    const updatedState: State = handleEnum(emptyState, mockEnum)
    expect(JSON.stringify(updatedState.enumsMap, (_k, v) => v === undefined ? 'undefined' : v, 2)).toMatchInlineSnapshot(`
"{
  "Taco": {
    "HardShell": "undefined",
    "SoftShell": "undefined"
  }
}"
`)
  })

  it("adds exported enum with values to map", () => {
    const mockEnum = factory.createEnumDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      'Taco',
      [
        factory.createEnumMember('HardShell', factory.createStringLiteral('hard-shell')),
        factory.createEnumMember('SoftShell', factory.createStringLiteral('soft-shell')),
      ]
    )
    const updatedState: State = handleEnum(emptyState, mockEnum)
    expect(JSON.stringify(updatedState.enumsMap, null, 2)).toMatchInlineSnapshot(`
"{
  "Taco": {
    "HardShell": "hard-shell",
    "SoftShell": "soft-shell"
  }
}"
`)
  })
})
