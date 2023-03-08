import {accessSync} from "fs"
import path from "path"

import {Component, State} from "./types"

export function newEmptyState(inputFilePath = "", propsFormat?: string): State {
  return {
    complexMap: {},
    componentsMap: {},
    enumsMap: {},
    importsMap: {},
    inputFilePath,
    propsFormat: propsFormat || '{Component}Props',
  }
}

export function newEmptyComponent(): Component {
  return {
    props: {},
    importsUsed: {},
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

export function getFullPath(filePath: string, relativePath: string) {
  return path.resolve(path.dirname(filePath), relativePath)
}

export function getFileDir(filePath: string) {
  return filePath.replace(/^(.+)\/[^/]+$/, "$1/")
}

export function indent(str: string, ct = 1) {
  const spaces = [...new Array(ct)].fill("  ").join("")
  return `${spaces}${str}`
}

export function indentLines(str: string[], ct = 1) {
  return str.map(x => x.split("\n").map(x => indent(x, ct)).join(`\n`))
}

export function sortedEntries<T = unknown>(obj: Record<string, T>) {
  return [...Object.entries<T>(obj)].sort(([a, _x], [b, _y]) => a.localeCompare(b))
}

export function sortedKeys(obj: Record<string, unknown>) {
  return [...Object.keys(obj)].sort((a, b) => a.localeCompare(b))
}

export function warn(msg: string) {
  console.log(msg)
}

export function echo(msg: string) {
  console.log(msg)
}

export function nope(errorStr = "") {
  if (errorStr) console.error(errorStr)
  process.exit(1)
}
