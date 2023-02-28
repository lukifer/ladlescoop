import {
  renderDomTree,
  renderStory,
  unpackWrap,
} from "../src/storyTemplate"

describe("renderStory", () => {
  it("matches the snapshot", () => {
    const rendered = renderStory({
      componentName: "Taco",
      importsUsed: {
        "Cheese": "./Taco",
        "Salsa": "./Taco",
      },
      props: {
        toppings: {
          name: "toppings",
          type: "string[]",
          isOptional: false,
          argType: {
            control: {type: "select"},
            options: ["'Tomatoes'", "'Onions'", "'Sour Cream'"],
          },
        },
        cheese: {
          name: "cheese",
          type: "Cheese",
          isOptional: false,
          argType: {
            control: {type: "radio"},
            options: ["Cheese.None", "Cheese.ThreeCheeseBlend"],
          },
        },
        softShell: {
          name: "softShell",
          type: "boolean",
          isOptional: true
        }
      },
      wrap: "div(className='wrap'),MyProvider",
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
    <div className={'wrap'}>
      <MyProvider>
        <h3>Taco</h3>
        <Taco
          toppings={toppings}
          cheese={cheese}
          softShell={softShell}
        />
      </MyProvider>
    </div>
  )
}


TacoStory.argTypes = {
  toppings: {
    control: {
      type: "select",
    },
    options: [
      'Tomatoes',
      'Onions',
      'Sour Cream'
    ],
  },
  cheese: {
    control: {
      type: "radio",
    },
    options: [
      Cheese.None,
      Cheese.ThreeCheeseBlend
    ],
  }
}"
`)
  })

  const testString = "main,div(className='foo'|id='bar'),MockProvider(mocks=[])"

  it("unwraps a wrapper string into a DOM structure", () => {
    expect(unpackWrap(testString)).toMatchObject([
      ["main"],
      ["div", [["className", "'foo'"], ["id", "'bar'"]]],
      ["MockProvider", [["mocks", "[]"]]],
    ])
  })

  it("renders a DOM tree", () => {
    const domTree = [...unpackWrap(testString)]
    domTree.push(['Taco'])
    const rendered = renderDomTree(domTree)
    expect(rendered).toMatchInlineSnapshot(`
"  <main>
    <div className={'foo'} id={'bar'}>
      <MockProvider mocks={[]}>
        <h3>Taco</h3>
        <Taco
        />
      </MockProvider>
    </div>
  </main>"
`)
  })
})
