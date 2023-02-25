import {renderStory} from "../src/storyTemplate"

describe("renderStory", () => {
  it("matches the snapshot", () => {
    const rendered = renderStory({
      componentName: "Taco",
      enumsImport: ["Cheese", "Salsa"],
      props: {
        toppings: {
          name: "toppings",
          type: "string[]",
          isOptional: false,
          argType: {
            control: {
              type: "select",
              options: ["'Tomatoes'", "'Onions'", "'Sour Cream'"],
            },
          },
        },
        cheese: {
          name: "cheese",
          type: "Cheese",
          isOptional: false,
          argType: {
            control: {
              type: "radio",
              options: ["Cheese.None", "Cheese.ThreeCheeseBlend"],
            },
          },
        },
        softShell: {
          name: "softShell",
          type: "boolean",
          isOptional: true
        }
      }
    })
    expect(rendered).toMatchInlineSnapshot(`
"import React from "react"
import type {Story} from "@ladle/react"

import {Taco} from "./Taco"
import {Cheese, Salsa} from "./Taco"

export const TacoStory: Story<{
  toppings: string[]
  cheese: Cheese
  softShell?: boolean
}> = ({
  toppings,
  cheese,
  softShell
}) => {
  return (
    <div>
      <Taco
        toppings={toppings}
        cheese={cheese}
        softShell={softShell}
      />
    </div>
  )
}


TacoStory.argTypes = {
  toppings: {
    control: {
      type: "select",
      options: ['Tomatoes', 'Onions', 'Sour Cream'],
    }
  },
  cheese: {
    control: {
      type: "radio",
      options: [Cheese.None, Cheese.ThreeCheeseBlend],
    }
  }
}"
`)
  })
})
