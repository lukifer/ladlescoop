# LadleScoop

Automatically generate [Ladle](https://ladle.dev) stories from existing React components, extracting Props definitions and default values, and automatically creating [controls](https://ladle.dev/docs/controls) from types.

Still a WIP: currently works on one file at a time, with the following assumptions:
- TypeScript only
- Components defined with `function`, rather than `const MyComponent = () => ...`
- Props type has a name convention of `MyComponentProps`
- ...defined in the same file as component
- Some behaviors assume inline destructuring of props: `({foo, bar}: MyProps) => {...`

Story files are written based on component name, not input file. An input file of `Foo.tsx` containing `function Bar` and `function Baz` will write `Bar.stories.tsx` and `Baz.stories.tsx`. Overwrites are ignored by default; use `--overwrite` if you wish to live dangerously.

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
- Parsing constants and pseudo-enum object constants
- Parsing plain JS in addition to TypeScript
- Multiple files and directories on CLI
- Settings for control prefences (`select` vs `radio`, etc)
- Array types and other nested props
- More unit test coverage

##### TODONT:
- Not looking to add custom formatting; BYO linter/formatter.
