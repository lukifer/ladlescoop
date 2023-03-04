import {accessSync} from "fs"
import path from "path"

import {State} from "./types"

export function newEmptyState(inputFilePath = "", propsFormat?: string): State {
  return {
    componentsMap: {},
    enumsMap: {},
    importsMap: {},
    importsUsed: {},
    inputFilePath,
    propsFormat: propsFormat || '{Component}Props',
  }
}

// Utility funcs
export function fileExists(filePath: string) {
  let exists = false
  try {
    accessSync(filePath)
    exists = true
  } catch {}
  return exists
}

export function getFileName(filePath: string, withExtension = false) {
  const inputFileName = filePath.split("/").reverse()[0]
  if (withExtension) return inputFileName
  return inputFileName.replace(/\.tsx?$/, '')
}

export function getFullPath(inputFilePath: string, relativePath: string) {
  return path.resolve(path.dirname(inputFilePath), relativePath)
}

export function indent(str: string, ct = 1) {
  const spaces = [...new Array(ct)].fill("  ").join("")
  return `${spaces}${str}`
}

export function indentLines(str: string[], ct = 1) {
  return str.map(x => x.split("\n").map(x => indent(x, ct)).join(`\n`))
}

export function warn(msg: string) {
  console.log(msg)
}

export function nope(errorStr = "") {
  if (errorStr) console.error(errorStr)
  process.exit(1)
}
