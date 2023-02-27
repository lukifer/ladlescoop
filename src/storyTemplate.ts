import {
  ArgType,
  ArgTypesMap,
  DeepReadonly,
  DomTree,
  Prop,
} from "./types"
import {indentLines} from "./utils"

type StoryRenderOptions = {
  componentName: Readonly<string>
  importsUsed: DeepReadonly<Record<string, string>>,
  isDefaultExport?: boolean
  props?: DeepReadonly<Record<string, Prop>>
  wrap?: string
}

export function renderStory({
  componentName,
  importsUsed,
  isDefaultExport,
  props = {},
  wrap = 'div',
}: StoryRenderOptions) {
  const storyName = `${componentName}Story`
  const defaultValues = Object.keys(props).reduce<Array<[string, string]>>((out, k) => {
    const {defaultValue} = props[k]
    if (defaultValue === undefined) return out
    return [...out, [k, defaultValue]]
  }, [])
  const argTypes = Object.keys(props).reduce<ArgTypesMap>((out, k) => {
    const {argType} = props[k]
    if (!argType) return out
    return {
      ...out,
      [k]: argType,
    }
  }, {})

  const importsByFile = Object.keys(importsUsed).reduce<Record<string, string[]>>((map, imp) => {
    const path = importsUsed[imp]
    if (!map[path]) map[path] = []
    map[path].push(imp)
    return map
  }, {})

  const domNodes = unpackWrap(wrap)
  domNodes.push([componentName, Object.keys(props).map(p => [p, p])])
  // console.log({domNodes})
  // console.log({wrap})
  // console.log({props})
  // console.log({defaultValues})
  // console.log({argTypes})
  return (
`import React from "react"
import type {Story} from "@ladle/react"

import ${isDefaultExport ? componentName : `{${componentName}}`} from "./${componentName}"
${Object.keys(importsByFile).map(path =>
`import {${importsByFile[path].join(', ')}} from "${path}"`
).join("\n")}

export const ${storyName}: Story<{${Object.keys(props).map(p => `
  ${p}${props[p].isOptional ? "?" : ""}: ${props[p].type}`).join("")}
}> = ({
  ${Object.keys(props).join(",\n  ")}
}) => {
  return (
${renderDomTree(domNodes, 2)}
  )
}
${defaultValues?.length ? `
${storyName}.args = {${defaultValues.map(([key, defaultValue]) => `
  ${key}: ${defaultValue},`).join('')}
}` : ''}

${storyName}.argTypes = {
${indentLines(Object.entries<DeepReadonly<ArgType>>(argTypes).map(([key, argType]) =>
`${key}: {
  control: {
    type: "${argType.control.type}",
    options: [${argType.control.options.join(", ")}],
  }
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

export function renderDomTree(domNodes: DomTree, indentCt = 1) {
  const [first, ...rest] = domNodes
  const [nodeName, attrs] = first
  const attrStrs = (attrs || []).map(([k, v]) => `${k}={${v}}`)

  if (!rest.length) return indentLines([
    `<h3>${nodeName}</h3>`,
    `<${nodeName}`,
    ...attrStrs.map(attr => `  ${attr}`),
    `/>`
  ]).join("\n")

  return indentLines([
    `<${nodeName}${attrStrs.length ? " " + attrStrs.join(" ") : ""}>`,
    renderDomTree(rest),
    `</${nodeName}>`
  ], indentCt).join("\n")
}
