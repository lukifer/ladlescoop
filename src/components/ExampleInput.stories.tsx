import React from "react"
import type {Story} from "@ladle/react"

import {ExampleInput} from "./ExampleInput"
import {Choices, ChoicesObj, Complex, FontSize, FontWeightObj} from "./ExampleInput"
import {ExportedFontSize, ExportedFontWeightObj} from "../types"

export const ExampleInputStory: Story<{
  allowNegative?: boolean
  choices: Choices[]
  choices2: Array<typeof ChoicesObj[keyof typeof ChoicesObj]>
  fontSize?: FontSize
  fontSizeLabel?: ExportedFontSize
  fontWeight?: typeof FontWeightObj[keyof typeof FontWeightObj]
  fontWeightLabel?: string
  json: Complex
  labelString: string | null
  maxValue?: number
  minValue?: -100 | 0 | 100
  onChange: (updatedValue: string) => void
  roundToNearest?: "none" | "ten" | "hundred"
  startingValue?: number | string
}> = ({
  allowNegative,
  choices,
  choices2,
  fontSize,
  fontSizeLabel,
  fontWeight,
  fontWeightLabel,
  json,
  labelString,
  maxValue,
  minValue,
  onChange,
  roundToNearest,
  startingValue
}) => {
  return (
    <div>
      <h3>ExampleInput</h3>
      <ExampleInput
        allowNegative={allowNegative}
        choices={choices}
        choices2={choices2}
        fontSize={fontSize}
        fontSizeLabel={fontSizeLabel}
        fontWeight={fontWeight}
        fontWeightLabel={fontWeightLabel}
        json={json}
        labelString={labelString}
        maxValue={maxValue}
        minValue={minValue}
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
  json: {"a":0,"b":"","c":{"d":[],"e":[]}},
  labelString: '',
  maxValue: 0,
  roundToNearest: "none",
  startingValue: 0,
}

ExampleInputStory.argTypes = {
  choices: {
    control: {type: "multi-select"},
    options: [
      Choices.one,
      Choices.two
    ],
  },
  choices2: {
    control: {type: "multi-select"},
    options: [
      ChoicesObj.three,
      ChoicesObj.four
    ],
  },
  fontSize: {
    control: {type: "multi-select"},
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