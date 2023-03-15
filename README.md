# LadleScoop

Automatically generate [Ladle](https://ladle.dev) stories from existing React components, extracting Props definitions and default values, and automatically creating [controls](https://ladle.dev/docs/controls) from types.

```
Usage: npx ladlescoop [options] <file>

Options:
  -o, --overwrite        overwrite existing file
  --dryrun               Don't write to file(s)
  --stdout               Print all output to stdout rather than filesysytem
  --propsformat <value>  Custom props naming format (default: "{Component}Props")
  --wrap <value>         Custom DOM wrapping: 'div(className="foo"|id="bar"),MockProvider(mocks=[])'
  -h, --help             display help for command
```

Takes a single TypeScript file (*.ts, *.tsx). Story files are written based on component name, not input file; so a `Foo.tsx` containing `function Bar` and `function Baz` will write `Bar.stories.tsx` and `Baz.stories.tsx`.

To run:
```
npm i
ts-node index.ts ./src/components/ExampleInput.tsx
```

Tests:
```
npm test
npm test -- -u # update snapshots
```

##### TODO:
- stdin support
- satisfies operator on args/argTypes
- Recursive type imports and composable types
- Look for props destructuring within render function
- More unit test coverage

##### TODONT:
- Not planning to add custom code formatting; BYO linter/formatter.
