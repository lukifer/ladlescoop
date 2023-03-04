# LadleScoop

Automatically generate [Ladle](https://ladle.dev) stories from existing React components, extracting Props definitions and default values, and automatically creating [controls](https://ladle.dev/docs/controls) from types.

```
Usage: npx ladlescoop [options] <file>

Options:
  -o, --overwrite        overwrite existing file
  --propsformat <value>  Custom props naming format (default: "{Component}Props")
  --wrap <value>         Custom DOM wrapping: 'div(className="foo"|id="bar"),MockProvider(mocks=[])'
  -h, --help             display help for command
```

Currently works on a single file, with the following assumptions:
- TypeScript files (*.ts, *.tsx)
- Components defined with `function`, rather than `const MyComponent = () => ...`
- Props type is defined in the same file as component

Story files are written based on component name, not input file. An input file of `Foo.tsx` containing `function Bar` and `function Baz` will write `Bar.stories.tsx` and `Baz.stories.tsx`.

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
- Indexed access of pseudo-enum object constants
- Function props
- Parsing plain JS in addition to TypeScript
- Multiple files and directories on CLI
- Settings for control prefences (`select` vs `radio`, etc)
- More unit test coverage

##### TODONT:
- Not planning to add custom code formatting; BYO linter/formatter.
