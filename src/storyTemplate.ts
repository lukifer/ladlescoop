import {isJSX} from "./tsnode"
import {
  ArgType,
  ArgTypesMap,
  DeepReadonly,
  DomTree,
  Prop,
} from "./types"
import {
  getFileName,
  indentLines,
  sortedEntries,
  sortedKeys,
} from "./utils"

type StoryRenderOptions = {
  componentName: Readonly<string>
  hasChildren: boolean
  importsUsed: DeepReadonly<Record<string, string>>,
  inputFilePath: string
  isDefaultExport?: boolean
  props?: DeepReadonly<Record<string, Prop>>
  wrap?: string
}

export function renderStory({
  componentName,
  hasChildren,
  importsUsed,
  inputFilePath,
  isDefaultExport,
  props = {},
  wrap = "div",
}: StoryRenderOptions) {
  const storyName = `${componentName}Story`
  const defaultValues = sortedKeys(props).reduce<Array<[string, string]>>((out, k) => {
    const {defaultValue, type} = props[k]
    if (defaultValue === undefined || isJSX(type)) return out
    return [...out, [k, defaultValue]]
  }, [])
  const argTypes = sortedKeys(props).reduce<ArgTypesMap>((out, k) => {
    const {argType} = props[k]
    if (!argType) return out
    return {
      ...out,
      [k]: argType,
    }
  }, {})

  const inputFileName = getFileName(inputFilePath)

  const importsByFile = Object.keys(importsUsed).reduce<Record<string, string[]>>((map, imp) => {
    const path = importsUsed[imp]
    if (!map[path]) map[path] = []
    map[path].push(imp)
    return map
  }, {})

  const domNodes = unpackWrap(wrap)
  domNodes.push([componentName, sortedKeys(props).map(p => [p, p])])
  if (hasChildren) domNodes.push(["div"])
  // console.log({domNodes})
  // console.log({wrap})
  // console.log({props})
  // console.log({defaultValues})
  // console.log({argTypes})
  return (
`import React from "react"
import type {Story} from "@ladle/react"

import ${isDefaultExport ? componentName : `{${componentName}}`} from "./${inputFileName}"
${sortedKeys(importsByFile).map(path =>
`import {${[...importsByFile[path]].sort().join(", ")}} from "${path}"`).join("\n")}

export const ${storyName}: Story<{${sortedKeys(props).map(p => `
  ${p}${props[p].isOptional ? "?" : ""}: ${props[p].type}`).join("")}
}> = ({
  ${sortedKeys(props).map(p => `${p}${
    !props[p].isOptional && isJSX(props[p].type) ? ` = ${props[p].defaultValue}` : ""
  }`).join(",\n  ")}
}) => {
  return (
${renderDomTree(componentName, domNodes, 2)}
  )
}
${defaultValues?.length ? `
${storyName}.args = {${defaultValues.map(([key, defaultValue]) => `
  ${key}: ${defaultValue},`).join("")}
}` : ""}

${storyName}.argTypes = {
${indentLines(sortedEntries<DeepReadonly<ArgType>>(argTypes).map(([key, argType]) =>
`${key}: {
${argType.control ? `  control: {type: "${argType.control.type}"},` : ""
}${argType.action ? `  action: "${argType.action}",` : ""
}${argType.options ? `
  options: [
${indentLines([...argType.options], 2).join(",\n")}
  ],` : ""}
}`)).join(",\n")}
}`
  )
}

export function unpackWrap(wrap: string): DomTree {
  return wrap.split(",").map(str => {
    const propsMatch = str.match(/^([a-zA-Z0-9_]+)\((.+)\)$/)
    if (propsMatch?.length !== 3) return [str]

    const attrs: Array<[string, string?]> = propsMatch[2].split("|").map(p => {
      const tuple = p.split("=")
      return [tuple[0], tuple[1]]
    })

    return [propsMatch[1], attrs]
  })
}

export function renderDomTree(componentName: string, domNodes: DomTree, indentCt = 1) {
  const [first, ...rest] = domNodes
  const [nodeName, attrs] = first
  const attrStrs = (attrs || []).map(([k, v]) => v === undefined
    ? `${k}`
    : `${k}={${v}}`
  )

  const isTheComponent = nodeName === componentName
  const isLast = !rest.length

  const domPrefix = isTheComponent
    ? [`<h3>${nodeName}</h3>`]
    : []

  const renderedProps = isTheComponent
    ? [
      `<${nodeName}`,
      ...attrStrs.map(attr => `  ${attr}`),
      `${isLast ? "/" : ""}>`
    ]
    : [
      `<${nodeName}${attrStrs.length ? " " + attrStrs.join(" ") : ""}${isLast ? " /" : ""}>`
    ]

  if (isLast) return indentLines([
    ...domPrefix,
    ...renderedProps,
  ]).join("\n")

  return indentLines([
    ...domPrefix,
    ...renderedProps,
    renderDomTree(componentName, rest),
    `</${nodeName}>`
  ], indentCt).join("\n")
}
