import {
  ArgType,
  ArgTypesMap,
  DeepReadonly,
  Prop,
} from "./types"
import {indent} from "./utils"

type StoryRenderOptions = {
  componentName: Readonly<string>
  enumsImport: DeepReadonly<string[]>
  isDefaultExport?: boolean
  props?: DeepReadonly<Record<string, Prop>>
}

export function renderStory({
  componentName,
  enumsImport,
  isDefaultExport,
  props = {},
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
  // console.log({props})
  // console.log({defaultValues})
  // console.log({argTypes})
  return (
`import React from "react"
import type {Story} from "@ladle/react"

import ${isDefaultExport ? componentName : `{${componentName}}`} from "./${componentName}"
${enumsImport?.length ? `import {${enumsImport.join(", ")}} from "./${componentName}"
` : ''}
export const ${storyName}: Story<{${Object.keys(props).map(p => `
  ${p}${props[p].isOptional ? "?" : ""}: ${props[p].type}`).join("")}
}> = ({
  ${Object.keys(props).join(",\n  ")}
}) => {
  return (
    <div>
      <${componentName}${Object.keys(props).map(p => `
        ${p}={${p}}`).join('')}
      />
    </div>
  )
}
${defaultValues?.length ? `
${storyName}.args = {${defaultValues.map(([key, defaultValue]) => `
  ${key}: ${defaultValue},`).join('')}
}` : ''}

${storyName}.argTypes = {${indent(Object.entries<DeepReadonly<ArgType>>(argTypes).map(([key, argType]) => `
${key}: {
  control: {
    type: "${argType.control.type}",
    options: [${argType.control.options.join(", ")}],
  }
}`))}
}`
  )
}
