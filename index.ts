import {Command} from "commander"
import * as ts from "typescript"
import {writeFileSync} from "fs"

import {renderStory} from "./src/storyTemplate"
import {
  handleEnum,
  handleFunction,
  handleImport,
  handleInterface,
  handleObjectEnum,
  handleType,
} from './src/parseComponent'
import {
  getName,
  getSourceFile,
  isExported,
  traverse,
} from './src/tsnode'
import {
  echo,
  fileExists,
  getFileDir,
  getFileName,
  newEmptyState,
  nope,
  warn,
} from "./src/utils"

export function run(): void {
  const program = new Command()
  program.usage("npx ladlescoop [options] <file>")
  program.option("-o, --overwrite", "Overwrite existing file(s)")
  program.option("--dryrun", "Don't write to file(s)")
  program.option("--propsformat <value>", "Props naming format, such as '{Component}PropType'", "{Component}Props")
  program.option("--wrap <value>", "DOM wrapping: 'MockProvider(mocks=[]),div(className=\"foo\"|id=\"bar\")'", "div")
  program.parse(process.argv)
  const opts = program.opts()

  let inputFilePath = program.args[0]
  if (!inputFilePath) {
    nope("Error: missing file path argument")
  }
  if (!inputFilePath.match(/\.tsx?$/)) {
    nope("Only TypeScript currently supported")
  }
  if (getFileDir(inputFilePath) === inputFilePath) {
    inputFilePath = `./${inputFilePath}`
  }

  const filesWritten = []

  function createStoryForFile(filePath: string) {
    const dirPath = getFileDir(filePath)

    const sourceFile: ts.SourceFile = getSourceFile(filePath)
    if (!sourceFile) nope(`An error occurred reading "${filePath}"`)

    let state = newEmptyState(inputFilePath, opts.propsformat)

    sourceFile.statements.forEach(statement => {
      switch (statement.kind) {
        case ts.SyntaxKind.EnumDeclaration:
          if (!ts.isEnumDeclaration(statement)) return
          return state = handleEnum(state, statement)

        case ts.SyntaxKind.VariableStatement:
          if (!ts.isVariableStatement(statement)) return
          return state = handleObjectEnum(state, statement)

        case ts.SyntaxKind.ImportDeclaration:
          if (!ts.isImportDeclaration(statement)) return
          return state = handleImport(state, statement)
      }
    })

    sourceFile.statements.forEach(statement => {
      switch (statement.kind) {
        case ts.SyntaxKind.TypeAliasDeclaration:
          if (!ts.isTypeAliasDeclaration(statement)) return
          return state = handleType(state, statement)

        case ts.SyntaxKind.InterfaceDeclaration:
          if (!ts.isInterfaceDeclaration(statement)) return
          return state = handleInterface(state, statement)
      }
    })

    sourceFile.statements.forEach(fn => {
      switch (fn.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
          if (!ts.isFunctionDeclaration(fn)) return
          if (!isExported(fn)) warn(`Warning: Component ${getName(fn)} is not exported`)
          return state = handleFunction(state, fn)

        case ts.SyntaxKind.VariableStatement:
          const [arrowFn] = traverse(fn, [
            [ts.SyntaxKind.VariableDeclarationList, 0],
            [ts.SyntaxKind.VariableDeclaration, 0],
            [ts.SyntaxKind.ArrowFunction, 0],
          ])
          if (!arrowFn || !ts.isArrowFunction(arrowFn)) return
          if (!isExported(fn)) warn(`Warning: Component ${getName(arrowFn.parent)} is not exported`)
          return state = handleFunction(state, arrowFn)
      }
    })

    Object.keys(state.componentsMap).forEach((componentName) => {
      const outputFilePath = `${dirPath}${componentName}.stories.tsx`
      if (!opts.overwrite && !opts.dryrun && fileExists(outputFilePath)) {
        warn(`Error: story file "${outputFilePath}" already exists. Use --overwrite to replace it.`)
        return
      }
      const {
        hasChildren,
        hasFunction,
        importsUsed,
        isDefaultExport,props,
      } = state.componentsMap[componentName]
      if (!hasFunction) return
      if (!props && componentName !== getFileName(filePath)) return

      const renderedStory = renderStory({
        componentName,
        hasChildren,
        importsUsed,
        inputFilePath,
        isDefaultExport,
        props,
        wrap: opts.wrap || 'div',
      })
      // console.log({outputFilePath})
      // console.log({renderedStory})
      try {
        if (!opts.dryrun) {
          writeFileSync(outputFilePath, renderedStory)
        }
        filesWritten.push(outputFilePath)
      } catch(e) {
        warn(`Something went wrong writing ${outputFilePath}: ${e}`
      )}
    })
  }

  createStoryForFile(inputFilePath)

  if (filesWritten.length) {
    const plur = filesWritten.length > 1 ? 's' : ''
    const root = opts.dryrun ? 'Did not write' : 'Wrote'
    echo(`${root} the following file${plur}: \n${filesWritten.join('\n')}`)
  } else {
    echo("No files written.")
  }
}

run()
