import React from "react"
import type {Story} from "@ladle/react"

import {ExampleInput} from "./ExampleInput"
import {FontSize, FontWeightObj} from "./ExampleInput"
import {ExportedFontSize, ExportedFontWeightObj} from "../types"

export const ExampleInputStory: Story<{
  allowNegative?: boolean
  fontSize?: FontSize
  fontSizeLabel?: ExportedFontSize
  fontWeight?: string
  fontWeightLabel?: string
  labelString: string | null
  minValue?: -100 | 0 | 100
  maxValue?: number
  onChange: (updatedValue: string) => void
  roundToNearest?: "none" | "ten" | "hundred"
  startingValue?: number | string
}> = ({
  allowNegative,
  fontSize,
  fontSizeLabel,
  fontWeight,
  fontWeightLabel,
  labelString,
  minValue,
  maxValue,
  onChange,
  roundToNearest,
  startingValue
}) => {
  return (
    <div>
      <h3>ExampleInput</h3>
      <ExampleInput
        allowNegative={allowNegative}
        fontSize={fontSize}
        fontSizeLabel={fontSizeLabel}
        fontWeight={fontWeight}
        fontWeightLabel={fontWeightLabel}
        labelString={labelString}
        minValue={minValue}
        maxValue={maxValue}
        onChange={onChange}
        roundToNearest={roundToNearest}
        startingValue={startingValue}
      >
        <div />
      </ExampleInput>
    </div>
  )
}

ExampleInputStory.args = {
  allowNegative: true,
  fontSize: FontSize.medium,
  fontSizeLabel: ExportedFontSize.medium,
  fontWeight: FontWeightObj.normal,
  fontWeightLabel: ExportedFontWeightObj.normal,
  labelString: '',
  maxValue: 0,
  roundToNearest: "none",
  startingValue: 0,
}

ExampleInputStory.argTypes = {
  fontSize: {
    control: {type: "select"},
    options: [
      FontSize.small,
      FontSize.medium,
      FontSize.large
    ],
  },
  fontSizeLabel: {
    control: {type: "select"},
    options: [
      ExportedFontSize.small,
      ExportedFontSize.medium,
      ExportedFontSize.large
    ],
  },
  fontWeight: {
    control: {type: "radio"},
    options: [
      FontWeightObj.normal,
      FontWeightObj.bold
    ],
  },
  fontWeightLabel: {
    control: {type: "radio"},
    options: [
      ExportedFontWeightObj.normal,
      ExportedFontWeightObj.bold
    ],
  },
  minValue: {
    control: {type: "select"},
    options: [
      -100,
      0,
      100
    ],
  },
  onChange: {
    action: "onChange",
  },
  roundToNearest: {
    control: {type: "select"},
    options: [
      "none",
      "ten",
      "hundred"
    ],
  }
}