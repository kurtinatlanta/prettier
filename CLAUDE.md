# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **fork of Prettier** (`@kurtinatlanta/prettier`) with custom formatting rules called "Hoyt Style." The fork adds opinionated blank line ("paragraphing") rules and Stroustrup-style control flow formatting.

**See [`STYLE.md`](STYLE.md) for detailed documentation of the custom formatting rules.**

Prettier is an opinionated code formatter that supports JavaScript, TypeScript, CSS, HTML, Markdown, YAML, and many other languages. It works by parsing code and re-printing it according to its own rules.

## Essential Commands

### Development Workflow
```bash
# Install dependencies
yarn

# Build Prettier (outputs to dist/)
yarn build

# Run all tests
yarn test

# Run tests with snapshot updates
yarn test -u

# Run specific test file
yarn test path/to/test

# Lint and format code
yarn fix

# Debug Prettier on a file
yarn debug path/to/file.js
yarn debug:watch path/to/file.js  # with auto-reload
yarn debug:inspect path/to/file.js # with debugger
```

### Performance Testing
```bash
# Run with timing measurements
PRETTIER_PERF_REPEAT=1000 yarn perf <filename>

# Run with node inspector for profiling
PRETTIER_PERF_REPEAT=1000 yarn perf:inspect <filename>

# Run benchmark with tinybench
yarn perf:benchmark <filename>

# Compare performance between branches
PRETTIER_PERF_FILENAME=my.js ./scripts/benchmark/compare.sh main my-branch
```

### Deeper Testing
```bash
# Run comprehensive tests (AST comparison, second format, EOL variations, BOM)
FULL_TEST=1 yarn test
```

## Architecture

### Core Formatting Algorithm

Prettier uses an intermediate representation called **Doc** (documented in `commands.md`). The algorithm:

1. **Parse** - Source code → AST (using language-specific parsers)
2. **Print** - AST → Doc (intermediate representation)
3. **Layout** - Doc → formatted string (printer algorithm in `src/document/printer.js`)

The Doc IR consists of:
- **Strings** - printed directly
- **Arrays** - concatenate docs sequentially
- **Commands** - `group`, `indent`, `line`, `hardline`, `softline`, `ifBreak`, `fill`, etc.

The printer algorithm tries to fit things on one line; when they don't fit, it breaks the outermost `group` first and recurses.

### Directory Structure

#### Language Plugins (`src/language-*/`)

Each language follows a standard plugin structure:
- `index.js` - Plugin entry point (exports languages, options, parsers, printers)
- `languages.evaluate.js` - Language definitions and file extensions
- `options.js` - Language-specific formatting options
- `parse/` - Parser implementations
- `parser-*.js` - Main parser entry point
- `print/` - Printer implementations (AST → Doc conversion)
- `printer-*.js` - Main printer entry point
- `clean.js` - AST normalization (remove location data, etc.)
- `embed.js` - Handle embedded languages (e.g., JS in HTML)
- `loc.js` - Extract location information from AST nodes
- `utilities/` or `utils/` - Helper functions
- `visitor-keys.js` - AST traversal keys

**Key language-specific printers:**
- `src/language-js/print/` - JavaScript/TypeScript formatting logic split into ~60+ specialized files:
  - `estree.js` - Main entry point, delegates to specialized printers
  - `if-statement.js`, `try-statement.js`, `while-statement.js` - Control flow
  - `function.js`, `arrow-function.js` - Function formatting
  - `class.js` - Class declarations and expressions
  - `array.js`, `object.js` - Data structures
  - `binaryish.js`, `ternary.js` - Operators
  - And many more specialized printers...

#### Core Systems

- `src/main/` - Core formatting orchestration
  - `main/comments/` - Comment attachment and printing
  - `main/create-format-result.js` - Format result creation
  - `main/range.js` - Range formatting support

- `src/document/` - Doc IR and printer
  - `builders.js` - Doc command constructors (`group`, `indent`, etc.)
  - `printer.js` - Layout algorithm that converts Doc → string
  - `utils.js` - Doc manipulation utilities

- `src/common/` - Shared utilities
  - `ast-path.js` - AST traversal abstraction
  - `end-of-line.js` - Line ending normalization

- `src/cli/` - CLI implementation
- `src/config/` - Configuration file loading (supports editorconfig)
- `src/plugins/` - Built-in plugin loaders
- `src/utilities/` - General utility functions

### Build System (`scripts/build/`)

The build process uses esbuild and creates multiple output formats:
- Main package (`dist/prettier/`)
  - ESM (`.mjs`), CommonJS (`.cjs`), and standalone browser bundles
  - CLI binary, internal modules, plugins
- Plugin packages (`dist/plugin-*`)

Build customization:
- `scripts/build/packages/` - Package-specific build configurations
- `scripts/build/esbuild-plugins/` - Custom esbuild plugins
- `scripts/build/shims/` - Polyfills for newer JavaScript features
- `scripts/build/transform/` - AST transformations for build output

## Testing

### Test Structure

Tests live in `tests/format/` organized by language. Each directory contains:

1. **Input files** - Code samples to format (various file extensions)
2. **`format.test.js`** - Test configuration using `runFormatTest()`:
   ```js
   runFormatTest(import.meta, ["babel", "flow", "typescript"]);
   ```
3. **`__snapshots__/jsfmt.spec.js.snap`** - Expected output snapshots

**Key `runFormatTest` parameters:**
- `import.meta` - Required, points to current test directory
- Array of parser names - Tests verify all parsers produce same output
- Options object - Prettier formatting options + `errors` property for error cases

**Implicit parser expansion:**
- `"typescript"` → includes `"babel-ts"`, `"oxc-ts"`
- `"flow"` → includes `"hermes"`
- `"babel"` (in `tests/format/js[x]/`) → includes `"acorn"`, `"espree"`, `"meriyah"`, `"oxc"`

### Flow Test Suite

`tests/format/flow-repo/` is automatically synced from Flow's test suite. To update:
```bash
# Clone Flow repo adjacent to Prettier repo
node scripts/sync-flow-tests.cjs ../flow/tests/
```

## Pull Request Requirements

1. **Update snapshots** - Always run `yarn test -u` to update snapshots after changes
2. **Create changelog entry** - Add file in `changelog_unreleased/` directory:
   ```bash
   yarn generate-changelog
   ```
   Follow template in `changelog_unreleased/TEMPLATE.md`
3. **Run linters** - `yarn fix` formats and fixes lint issues
4. **No new options** - Prettier does not accept PRs adding formatting options (see `docs/option-philosophy.md`)

## Modifying JavaScript/TypeScript Formatting

When changing JS/TS formatting behavior:

1. **Locate the relevant printer** in `src/language-js/print/`:
   - Control flow: `if-statement.js`, `try-statement.js`, `while-statement.js`, `for-statement.js`
   - Functions: `function.js`, `arrow-function.js`, `method.js`
   - Classes: `class.js`
   - Expressions: `binaryish.js`, `ternary.js`, `assignment.js`
   - Data structures: `array.js`, `object.js`
   - Main dispatcher: `estree.js`

2. **Understand the Doc commands** (see `commands.md`):
   - `hardline` - Always break (newline)
   - `line` - Break if needed, else space
   - `softline` - Break if needed, else nothing
   - `group()` - Try to fit on one line
   - `indent()` - Increase indentation

3. **Update tests** - Add test cases in `tests/format/js/` or relevant subdirectory

4. **Run tests with snapshot updates**:
   ```bash
   yarn test -u
   git diff # Review changes
   ```

## Common Patterns

### Adding a new language printer function

When extracting logic into a new function (e.g., splitting `estree.js`):
1. Create file in `src/language-js/print/new-feature.js`
2. Export function: `export { printNewFeature };`
3. Import in `estree.js`: `import { printNewFeature } from "./new-feature.js";`
4. Call from switch case in `printEstree()`

### Working with Doc builders

```js
import { group, hardline, indent, line } from "../../document/builders.js";

// Try to fit on one line, break if needed
group(["if (", print("test"), ")", print("body")])

// Always break
[hardline, "else", print("alternate")]

// Conditional formatting
ifBreak(breakContents, flatContents)
```

### Comment handling

Comments are handled separately via `comments/handle-comments.js`:
- Attach comments to nodes during parsing
- Use `printDanglingComments()` for comments between nodes
- Check for comments: `hasComment(node, CommentCheckFlags.Dangling)`

## Performance Considerations

- The Doc printer is performance-sensitive; avoid allocations in hot paths
- Use `label()` for doc introspection instead of wrapping in extra structures
- The `group()` command triggers the core breaking algorithm
- Avoid `conditionalGroup()` when possible (exponential complexity when nested)

## Debugging Tips

For debugging formatting issues:
1. Use `yarn debug <file>` to format a specific file
2. Add `console.log()` in printer functions to inspect Doc structure
3. Use the Prettier playground (build website with `yarn build:website`)
4. Check `commands.md` for Doc command semantics
5. Read Wadler's paper (linked in `commands.md`) for algorithm background

## Hoyt Style Fork

This fork implements custom formatting rules. Key files for the custom behavior:

### Paragraphing (Blank Line) Rules
- `src/language-js/print/statement-sequence.js` - Main logic for blank lines between statements
  - `isTopLevelDeclaration()` - Identifies functions, classes, interfaces, types, enums
  - `isBlockStatement()` - Identifies if, for, while, try, switch, etc.
  - `isParagraphStatement()` - Combines above + function expressions
  - `areInSameDeclarationBlock()` - Groups same-kind simple declarations
  - `shouldEnforceBlankLineBetween()` - Main decision function

### Stroustrup Style (Control Flow)
- `src/language-js/print/if-statement.js` - `else` on its own line
- `src/language-js/print/try-statement.js` - `catch`/`finally` on their own lines
- `src/language-js/print/while-statement.js` - `while` in do-while on its own line

### Switch Case Spacing
- `src/language-js/print/switch-statement.js` - Blank lines between cases

### Versioning Scheme

The fork uses the format: `{upstream-version}-hoyt.{release}`

Example: `3.8.0-hoyt.1`
- `3.8.0` = upstream Prettier version this fork is based on
- `hoyt.1` = first release of Hoyt style customizations

When merging upstream:
- Prettier 3.9.0 → bump to `3.9.0-hoyt.1`
- Bug fix in fork → bump to `3.8.0-hoyt.2`

### Maintaining the Fork

When merging upstream Prettier changes:
1. The custom files above may have conflicts
2. Focus on preserving the logic in `shouldEnforceBlankLineBetween()`
3. Run `yarn test -u` to update snapshots after merging
4. Update version in `package.json` to reflect new upstream version
5. Test with sample code to verify paragraphing still works:
   ```bash
   node -e "import * as prettier from './src/index.js'; ..."
   ```

### Publishing to npm

To publish a new release:

```bash
# 1. Update version in package.json (e.g., 3.8.0-hoyt.2)

# 2. Commit and tag
git add -A && git commit -m "chore: release 3.8.0-hoyt.2"
git tag -a "3.8.0-hoyt.2" -m "Release 3.8.0-hoyt.2"

# 3. Push to origin
git push origin <branch> && git push origin 3.8.0-hoyt.2

# 4. Build and publish
yarn build
cd dist/prettier && npm publish --ignore-scripts --tag latest
```

Note: `--ignore-scripts` is required because the build's `prepublishOnly` script has a broken path reference.
