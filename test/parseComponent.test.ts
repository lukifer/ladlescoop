import * as ts from "typescript"

import {
  extractObjectEnumValues,
  getFnFromProps,
  handleEnum,
  handleInterface,
  handleType,
} from "../src/parseComponent"
import {newEmptyState} from "../src/utils"

const {factory} = ts

const stringify = (obj: object) => JSON.stringify(obj, (_k, v) => v === undefined ? "undefined" : v, 2)

const emptyState = newEmptyState()

describe("parseComponent", () => {
  it("parses props from format", () => {
    const componentName = getFnFromProps("My{Component}Props", "MyTacoProps")
    expect(componentName).toMatch("Taco")
  })

  it("adds exported enum to map", () => {
    const mockEnum = factory.createEnumDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      "Taco",
      [
        ts.factory.createEnumMember("HardShell"),
        ts.factory.createEnumMember("SoftShell"),
      ]
    )
    const {enumsMap} = handleEnum(emptyState, mockEnum)
    expect(stringify(enumsMap)).toMatchInlineSnapshot(`
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
      "Taco",
      [
        factory.createEnumMember("HardShell", factory.createStringLiteral("hard-shell")),
        factory.createEnumMember("SoftShell", factory.createStringLiteral("soft-shell")),
      ]
    )
    const {enumsMap} = handleEnum(emptyState, mockEnum)
    expect(stringify(enumsMap)).toMatchInlineSnapshot(`
"{
  "Taco": {
    "HardShell": "hard-shell",
    "SoftShell": "soft-shell"
  }
}"
`)
  })

  it("parses a component props type", () => {
    const mockType = factory.createTypeAliasDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier("TacoProps"),
      [
        factory.createTypeParameterDeclaration([], "salsa")
      ],
      factory.createTypeLiteralNode([
        factory.createPropertySignature(
          [],
          "salsa",
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      ])
    )

    const {componentsMap} = handleType(emptyState, mockType)
    expect(stringify(componentsMap)).toMatchInlineSnapshot(`
"{
  "Taco": {
    "props": {
      "salsa": {
        "kind": 152,
        "type": "string",
        "defaultValue": "''",
        "name": "salsa",
        "isOptional": true
      }
    },
    "importsUsed": {}
  }
}"
`)
  })

  it("parses a component props interface", () => {
    const mockInterface = factory.createInterfaceDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier("TacoProps"),
      [
        factory.createTypeParameterDeclaration([], "salsa")
      ],
      undefined,
      [
        factory.createPropertySignature(
          [],
          factory.createIdentifier("salsa"),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      ]
    )

    const {componentsMap} = handleInterface(emptyState, mockInterface)
    expect(stringify(componentsMap)).toMatchInlineSnapshot(`
"{
  "Taco": {
    "props": {
      "salsa": {
        "kind": 152,
        "type": "string",
        "defaultValue": "''",
        "name": "salsa",
        "isOptional": true
      }
    },
    "importsUsed": {}
  }
}"
`)
  })

  it("extracts values from an object literal", () => {
    const objectLiteral = factory.createObjectLiteralExpression(
      [
        ["one", "1"],
        ["two", "2"]
      ].map(tuple => factory.createPropertyAssignment(
          factory.createIdentifier(tuple[0]),
          factory.createStringLiteral(tuple[1]),
      ))
    )

    const extractedValues = extractObjectEnumValues(objectLiteral)
    expect(extractedValues).toMatchObject({
      "one": 1,
      "two": 2,
    })
  })
})
