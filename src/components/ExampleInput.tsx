import React, {useState} from "react"

import {
  ExportedFontSize,
  ExportedFontWeightObj,
  ExportedButIgnored as _ExportedButIgnored,
  EXPORTED_MAX_VALUE as _EXPORTED_MAX_VALUE,
} from "../types"

export enum FontSizeNoValues {
  small,
  medium,
  large,
}
export enum FontSize {
  small = "0.8rem",
  medium = "1rem",
  large = "1.2rem",
}
export const FontWeightObj = {
  normal: "400",
  bold: "700",
} as const

export const MAX_VALUE = 1000

export type IgnoreMeProps = {
  nothing: null
}

export type ExampleInputProps = {
  allowNegative?: boolean
  children?: React.ReactNode
  fontSize?: FontSize
  fontSizeLabel?: ExportedFontSize
  // fontWeight?: typeof FontSizeObj[keyof typeof FontSizeObj] // TODO
  fontWeight?: string
  fontWeightLabel?: string
  labelString: string | null
  minValue?: -100 | 0 | 100
  maxValue?: number
  onChange: (updatedValue: string) => void
  roundToNearest?: "none" | "ten" | "hundred"
  startingValue?: number | string
}

export function ExampleInput({
  allowNegative = true,
  fontSize = FontSize.medium,
  fontSizeLabel = ExportedFontSize.medium,
  fontWeight = FontWeightObj.normal,
  fontWeightLabel = ExportedFontWeightObj.normal,
  labelString,
  minValue,
  maxValue = MAX_VALUE,
  onChange,
  roundToNearest = "none",
  startingValue = 0,
}: ExampleInputProps) {
  const [value, setValue] = useState<string>(`${startingValue}`)
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let updatedValue = parseInt(e.target.value)
    if (!allowNegative) updatedValue = Math.max(0, updatedValue)
    if (roundToNearest !== "none") { // not actual rounding, don't @ me :P
      updatedValue -= (updatedValue % (roundToNearest === "ten" ? 10 : 100))
    }
    if (maxValue !== undefined) updatedValue = Math.min(updatedValue, maxValue)
    if (minValue !== undefined) updatedValue = Math.max(updatedValue, minValue)
    setValue(`${updatedValue || 0}`)
  }
  return (
    <div>
      <label>
        <span style={{fontSize: fontSizeLabel, fontWeight: fontWeightLabel}}>
          {labelString || "Default Label"}
        </span>
        <input
          type="text"
          defaultValue={startingValue}
          onBlur={onBlur}
          onChange={({target}) => {
            setValue(target.value)
            onChange(target.value)
          }}
          style={{fontSize, fontWeight}}
          value={value}
        />
      </label>
    </div>
  )
}
