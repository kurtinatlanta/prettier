# Hoyt Style Formatting Guide

This document describes the custom formatting rules in this Prettier fork (`@kurtinatlanta/prettier`). The philosophy is that code should be "paragraphed" - using blank lines to separate logical units, similar to how prose uses paragraphs to organize ideas.

## Philosophy

Code is more readable when logically distinct sections are visually separated. This fork enforces consistent blank line usage to create clear "paragraphs" in code, reducing cognitive load and making structure immediately apparent.

## Stroustrup Style (Control Flow)

Control flow keywords (`else`, `catch`, `finally`, `while` in do-while) are placed on their own line rather than cuddled with the closing brace.

```javascript
// Hoyt Style
if (condition) {
  doSomething();
}
else {
  doSomethingElse();
}

try {
  riskyOperation();
}
catch (error) {
  handleError(error);
}
finally {
  cleanup();
}

do {
  work();
}
while (condition);
```

## Blank Line Rules

### Imports/Exports

Blank line after import/export block when followed by other code:

```javascript
import { foo } from "foo";
import { bar } from "bar";

const config = {};
```

### Declaration Blocks

Variable declarations of the same kind (and style) form a "paragraph":

```javascript
const API_URL = "https://api.example.com";
const TIMEOUT = 5000;
const MAX_RETRIES = 3;

let counter = 0;
let isRunning = false;

const { user, session } = context;

const handleClick = () => {
  // Arrow functions are their own paragraph
};
```

Rules:
- Same declaration kind (`const`, `let`, `var`) without destructuring → same paragraph
- Different declaration kind → new paragraph
- Destructuring → its own paragraph
- Function expression/arrow function in declaration → its own paragraph

### Top-Level Declarations

Functions, classes, interfaces, types, and enums are always paragraphs:

```javascript
interface User {
  name: string;
}

interface Admin {
  role: string;
}

class UserService {
  getUser() {}
}

function processUser(user: User) {
  // ...
}

type UserId = string;

enum Status {
  Active,
  Inactive,
}
```

### Block Statements

Block statements (`if`, `for`, `while`, `try`, `switch`, etc.) are paragraphs:

```javascript
function example() {
  const data = fetchData();

  if (data.isEmpty) {
    return null;
  }

  for (const item of data.items) {
    process(item);
  }

  return data;
}
```

### Return Statements

Return statements get a blank line before them **only** when preceded by a block statement (not after simple declarations):

```javascript
// No blank before return (follows declaration)
function short() {
  const sum = a + b;
  return sum;
}

// Blank before return (follows block)
function afterBlock() {
  if (condition) {
    doSomething();
  }

  return result;
}

// Mixed: blank around block, no blank before final return
function mixed() {
  const x = calculate();

  if (needsProcessing(x)) {
    process(x);
  }

  const result = finalize(x);
  return result;
}
```

### Switch Cases

Blank lines between all switch cases:

```javascript
switch (action) {
  case "start":
    start();
    break;

  case "stop":
    stop();
    break;

  default:
    handleUnknown();
}
```

### Block Boundaries

No blank lines immediately after `{` or before `}`:

```javascript
// Correct
function example() {
  const x = 1;
  return x;
}

// NOT this (no leading/trailing blanks in blocks)
function example() {

  const x = 1;
  return x;

}
```

## Implementation Details

The paragraphing rules are implemented in:
- `src/language-js/print/statement-sequence.js` - Main blank line logic
- `src/language-js/print/switch-statement.js` - Switch case spacing
- `src/language-js/print/if-statement.js` - Stroustrup `else`
- `src/language-js/print/try-statement.js` - Stroustrup `catch`/`finally`
- `src/language-js/print/while-statement.js` - Stroustrup `while` in do-while

## Rationale

These rules are intentionally opinionated and not configurable. The goal is consistent, readable code without debates about style. When the formatter's output feels "wrong," it often indicates the code structure itself could be improved.
