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
        "Cheese": "./Tacos",
        "Salsa": "./Tacos",
      },
      hasChildren: true,
      inputFilePath: "../dir/Tacos.tsx",
      props: {
        children: {
          name: "children",
          type: "React.ReactNode",
          isOptional: true,
        },
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

import {Taco} from "./Tacos"
import {Cheese, Salsa} from "./Tacos"

export const TacoStory: Story<{
  children?: React.ReactNode
  toppings: string[]
  cheese: Cheese
  softShell?: boolean
}> = ({
  children,
  toppings,
  cheese,
  softShell
}) => {
  return (
    <div className={'wrap'}>
      <MyProvider>
        <h3>Taco</h3>
        <Taco
          children={children}
          toppings={toppings}
          cheese={cheese}
          softShell={softShell}
        >
          <div />
        </Taco>
      </MyProvider>
    </div>
  )
}


TacoStory.argTypes = {
  toppings: {
    control: {type: "select"},
    options: [
      'Tomatoes',
      'Onions',
      'Sour Cream'
    ],
  },
  cheese: {
    control: {type: "radio"},
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
    const rendered = renderDomTree('Taco', domTree)
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

  it("renders a DOM tree with a child DOM node", () => {
    const domTree = [...unpackWrap(testString)]
    domTree.push(['Taco', [['withCheese'], ['salsa', '"pico"']]])
    domTree.push(['div'])
    const rendered = renderDomTree('Taco', domTree)
    expect(rendered).toMatchInlineSnapshot(`
"  <main>
    <div className={'foo'} id={'bar'}>
      <MockProvider mocks={[]}>
        <h3>Taco</h3>
        <Taco
          withCheese
          salsa={"pico"}
        >
          <div />
        </Taco>
      </MockProvider>
    </div>
  </main>"
`)
  })
})
