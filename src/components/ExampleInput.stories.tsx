import React from "react"
import type {Story} from "@ladle/react"

import {ExampleInput} from "./ExampleInput"
import {FontSize} from "./ExampleInput"

export const ExampleInputStory: Story<{
  allowNegative?: boolean
  fontSize?: FontSize
  labelString: string | null
  minValue?: -100 | 0 | 100
  maxValue?: number
  roundToNearest?: 'none' | 'ten' | 'hundred'
  startingValue?: number | string
}> = ({
  allowNegative,
  fontSize,
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
  labelString: '',
  roundToNearest: 'none',
  startingValue: 0,
}

ExampleInputStory.argTypes = {
  fontSize: {
    control: {
      type: "select",
      options: [FontSize.small, FontSize.medium, FontSize.large],
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
      options: ['none', 'ten', 'hundred'],
    }
  }
}