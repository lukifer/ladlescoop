import {accessSync} from "fs"

// To test imports within AST
export enum ExportedFontSize {
  small = "0.8rem",
  medium = "1rem",
  large = "1.2rem",
}
export const EXPORTED_MAX_VALUE = 1000

// Utility funcs
export function fileExists(filePath: string) {
  let exists = false
  try {
    accessSync(filePath)
    exists = true
  } catch {}
  return exists
}

export function indent(str: string[], ct = 1) {
  const indent = [...new Array(ct)].fill("  ").join("")
  return str.map(x => x.split("\n").join(`\n${indent}`))
}

export function warn(msg: string) {
  console.log(msg)
}

export function nope(errorStr = "") {
  if (errorStr) console.error(errorStr)
  process.exit(1)
}
