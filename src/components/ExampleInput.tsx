import React, {useState} from 'react'

import {ExportedFontSize, EXPORTED_MAX_VALUE} from '../utils'

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
export const FontSizeObj = {
  small: "0.8rem",
  medium: "1rem",
  large: "1.2rem",
} as const
export const MAX_VALUE = 1000

type ExampleInputProps = {
  allowNegative?: boolean
  fontSize?: FontSize
  // fontSize?: typeof FontSizeObj[keyof typeof FontSizeObj]
  labelString: string | null
  minValue?: -100 | 0 | 100
  maxValue?: number
  roundToNearest?: 'none' | 'ten' | 'hundred'
  startingValue?: number | string
}

export function ExampleInput({
  allowNegative = true,
  fontSize = FontSize.medium,
  // fontSize = FontSizeObj.small,
  labelString,
  minValue,
  maxValue = MAX_VALUE,
  roundToNearest = 'none',
  startingValue = 0,
}: ExampleInputProps) {
  const [value, setValue] = useState<string>(`${startingValue}`)
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let updatedValue = parseInt(e.target.value)
    if (!allowNegative) updatedValue = Math.max(0, updatedValue)
    if (roundToNearest !== 'none') { // not actual rounding, don't @ me :P
      updatedValue -= (updatedValue % (roundToNearest === 'ten' ? 10 : 100))
    }
    if (maxValue !== undefined) updatedValue = Math.min(updatedValue, maxValue)
    if (minValue !== undefined) updatedValue = Math.max(updatedValue, minValue)
    setValue(`${updatedValue || 0}`)
  }
  return (
    <div>
      <label>
        <span>{labelString || 'Default Label'}</span>
        <input
          type="text"
          defaultValue={startingValue}
          onBlur={onBlur}
          onChange={({target}) => setValue(target.value)}
          style={{fontSize}}
          value={value}
        />
      </label>
    </div>
  )
}
