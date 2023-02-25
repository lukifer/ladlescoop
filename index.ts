import {Command} from "commander"
import * as ts from "typescript"
import {readFileSync, writeFileSync} from "fs"

import {renderStory} from "./src/storyTemplate"
import {
  handleEnum,
  handleFunction,
  handleInterface,
  handleType,
} from './src/parseComponent'
import {State} from './src/types'
import {
  fileExists,
  nope,
  warn,
} from "./src/utils"

const program = new Command()
program.option("-o, --overwrite", "overwrite existing file")
program.parse(process.argv)

const inputFilePath = program.args[0]
if (!inputFilePath) {
  nope("Error: missing file path argument")
}
if (!inputFilePath.match(/\.tsx?$/)) {
  nope("Only TypeScript currently supported")
}
const inputDirPath = inputFilePath.replace(/^(.+)\/[^/]+$/, "$1/")
if (!inputDirPath || inputDirPath === inputFilePath) {
  nope("only relative paths supported: use './myFile.ts', not 'myFile.ts'")
}

const sourceFile = ts.createSourceFile(
  inputFilePath,
  readFileSync(inputFilePath).toString(),
  ts.ScriptTarget.ESNext,
  true, // setParentNodes
  ts.ScriptKind.TSX
)

let state: State = {
  enumsMap: {},
  enumsImport: [],
  componentsMap: {},
}

sourceFile.statements.forEach(statement => {
  console.log("before state at:", JSON.stringify(state, null, 2))
  switch (statement.kind) {
    case ts.SyntaxKind.TypeAliasDeclaration:
      if (!ts.isTypeAliasDeclaration(statement)) return
      return state = handleType(state, statement)

    case ts.SyntaxKind.InterfaceKeyword:
      if (!ts.isInterfaceDeclaration(statement)) return
      return state = handleInterface(state, statement)

    case ts.SyntaxKind.EnumDeclaration:
      if (!ts.isEnumDeclaration(statement)) return
      return state = handleEnum(state, statement)

    // case ts.SyntaxKind.ImportDeclaration:
    //   if (!ts.isImportDeclaration(statement)) return
    //   return state = handleImport(state, statement)
  }
})

sourceFile.statements.forEach(fn => {
  switch (fn.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      if (!ts.isFunctionDeclaration(fn)) return
      return state = handleFunction(state, fn)
  }
})

// Write the story template for each component to files
const filesWritten = []
Object.keys(state.componentsMap).forEach((componentName) => {
  const outputFilePath = `${inputDirPath}${componentName}.stories.tsx`
  if (!program.opts().overwrite && fileExists(outputFilePath)) {
    warn(`Error: story file "${outputFilePath}" already exists. Use --overwrite to replace it.`)
    return
  }
  const {props} = state.componentsMap[componentName]
  if (!props) return
  const {enumsImport} = state
  const renderedStory = renderStory({
    componentName,
    enumsImport,
    props,
  })
  // console.log({outputFilePath})
  // console.log({renderedStory})
  try {
    writeFileSync(outputFilePath, renderedStory)
    filesWritten.push(outputFilePath)
  } catch(e) {warn(`Something went wrong writing ${outputFilePath}: ${e}`)}
})

if (filesWritten.length) {
  const plur = filesWritten.length > 1 ? 's' : ''
  console.log(`Wrote the following file${plur}: \n${filesWritten.join('\n')}`)
} else {
  console.log("No files written.")
}