import React from "react"
import type {Story} from "@ladle/react"

import {ExampleInput} from "./ExampleInput"
import {FontSize, FontWeightObj} from "./ExampleInput"
import {ExportedFontSize} from "../utils"

export const ExampleInputStory: Story<{
  allowNegative?: boolean
  fontSize?: FontSize
  fontSizeLabel?: ExportedFontSize
  fontWeight?: string
  labelString: string | null
  minValue?: -100 | 0 | 100
  maxValue?: number
  roundToNearest?: "none" | "ten" | "hundred"
  startingValue?: number | string
}> = ({
  allowNegative,
  fontSize,
  fontSizeLabel,
  fontWeight,
  labelString,
  minValue,
  maxValue,
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
        labelString={labelString}
        minValue={minValue}
        maxValue={maxValue}
        roundToNearest={roundToNearest}
        startingValue={startingValue}
      />
    </div>
  )
}

ExampleInputStory.args = {
  allowNegative: true,
  fontSize: FontSize.medium,
  fontSizeLabel: ExportedFontSize.medium,
  fontWeight: FontWeightObj.normal,
  labelString: '',
  roundToNearest: "none",
  startingValue: 0,
}

ExampleInputStory.argTypes = {
  fontSize: {
    control: {
      type: "select",
      options: [FontSize.small, FontSize.medium, FontSize.large],
    }
  },
  fontSizeLabel: {
    control: {
      type: "select",
      options: [ExportedFontSize.small, ExportedFontSize.medium, ExportedFontSize.large],
    }
  },
  fontWeight: {
    control: {
      type: "radio",
      options: [FontWeightObj.normal, FontWeightObj.bold],
    }
  },
  minValue: {
    control: {
      type: "select",
      options: [-100, 0, 100],
    }
  },
  roundToNearest: {
    control: {
      type: "select",
      options: ["none", "ten", "hundred"],
    }
  }
}