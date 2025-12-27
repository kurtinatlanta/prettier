import { hardline } from "../../document/index.js";
import { isNextLineEmpty } from "../utilities/index.js";

/**
 * @import {Doc} from "../../document/index.js"
 * @import AstPath from "../../common/ast-path.js")
 */

// =============================================================================
// Statement Classification Helpers
// =============================================================================

// Check if a node is an import/export declaration
function isImportOrExport(node) {
  return (
    node.type === "ImportDeclaration" ||
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration" ||
    node.type === "ExportAllDeclaration" ||
    node.type === "DeclareExportDeclaration" ||
    node.type === "DeclareExportAllDeclaration"
  );
}

// Check if a node is a top-level declaration (function, class, interface, type, etc.)
function isTopLevelDeclaration(node) {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "TSInterfaceDeclaration" ||
    node.type === "TSTypeAliasDeclaration" ||
    node.type === "TSEnumDeclaration" ||
    node.type === "TSModuleDeclaration" ||
    node.type === "DeclareClass" ||
    node.type === "DeclareFunction" ||
    node.type === "DeclareInterface" ||
    node.type === "DeclareTypeAlias" ||
    node.type === "DeclareModule" ||
    node.type === "InterfaceDeclaration" ||
    node.type === "TypeAlias" ||
    node.type === "EnumDeclaration" ||
    node.type === "ComponentDeclaration" ||
    node.type === "HookDeclaration"
  );
}

// Check if a node is a variable declaration (const, let, var)
function isVariableDeclaration(node) {
  return node.type === "VariableDeclaration";
}

// Check if a variable declaration uses destructuring
function isDestructuringDeclaration(node) {
  if (!isVariableDeclaration(node)) {
    return false;
  }
  return node.declarations.some(
    (decl) =>
      decl.id &&
      (decl.id.type === "ObjectPattern" || decl.id.type === "ArrayPattern"),
  );
}

// Get the declaration kind (const, let, var) for a variable declaration
function getDeclarationKind(node) {
  if (!isVariableDeclaration(node)) {
    return null;
  }
  return node.kind;
}

// Check if a node is a block statement (if, for, while, try, switch, with, etc.)
function isBlockStatement(node) {
  return (
    node.type === "IfStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement" ||
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "TryStatement" ||
    node.type === "SwitchStatement" ||
    node.type === "WithStatement" ||
    node.type === "BlockStatement" ||
    node.type === "LabeledStatement"
  );
}

// Check if a node is a return/throw/break/continue statement
function isReturnLikeStatement(node) {
  return node.type === "ReturnStatement";
}

// Check if a node is a "paragraph" statement that always needs blank lines around it
function isParagraphStatement(node) {
  return (
    isTopLevelDeclaration(node) ||
    isBlockStatement(node) ||
    // Function expressions assigned to variables are also paragraphs
    (node.type === "VariableDeclaration" &&
      node.declarations.some(
        (decl) =>
          decl.init &&
          (decl.init.type === "FunctionExpression" ||
            decl.init.type === "ArrowFunctionExpression"),
      ))
  );
}

// Check if two variable declarations are in the same "block"
// They're in the same block if: same kind (const/let/var) AND neither is destructuring
function areInSameDeclarationBlock(current, next) {
  if (!isVariableDeclaration(current) || !isVariableDeclaration(next)) {
    return false;
  }

  // Destructuring starts a new block
  if (isDestructuringDeclaration(current) || isDestructuringDeclaration(next)) {
    return false;
  }

  // Different kinds (const vs let) start a new block
  if (getDeclarationKind(current) !== getDeclarationKind(next)) {
    return false;
  }

  // Function expressions in declarations are their own paragraph
  const currentHasFunction = current.declarations.some(
    (decl) =>
      decl.init &&
      (decl.init.type === "FunctionExpression" ||
        decl.init.type === "ArrowFunctionExpression"),
  );
  const nextHasFunction = next.declarations.some(
    (decl) =>
      decl.init &&
      (decl.init.type === "FunctionExpression" ||
        decl.init.type === "ArrowFunctionExpression"),
  );

  if (currentHasFunction || nextHasFunction) {
    return false;
  }

  return true;
}

// =============================================================================
// Blank Line Enforcement Logic
// =============================================================================

// Determine if we should enforce a blank line between two statements
function shouldEnforceBlankLineBetween(current, next) {
  // Always add blank line after imports/exports when followed by non-import/export
  if (isImportOrExport(current) && !isImportOrExport(next)) {
    return true;
  }

  // Don't add blank lines within import/export blocks
  if (isImportOrExport(current) && isImportOrExport(next)) {
    return false;
  }

  // Variable declarations in the same block don't need blank lines
  if (areInSameDeclarationBlock(current, next)) {
    return false;
  }

  // Blank line after a declaration block (when followed by non-declaration or new block)
  // Exception: don't add blank line before return (return completes the declaration's "thought")
  if (
    isVariableDeclaration(current) &&
    !areInSameDeclarationBlock(current, next) &&
    !isReturnLikeStatement(next)
  ) {
    return true;
  }

  // Blank line before a declaration block (when preceded by non-declaration)
  if (
    isVariableDeclaration(next) &&
    !isVariableDeclaration(current) &&
    !isImportOrExport(current)
  ) {
    return true;
  }

  // Paragraph statements (functions, classes, blocks) always get blank lines around them
  if (isParagraphStatement(current) || isParagraphStatement(next)) {
    return true;
  }

  // Return statements get blank lines only after paragraph statements
  if (isReturnLikeStatement(next) && isParagraphStatement(current)) {
    return true;
  }

  // Blank line before return if preceded by a block statement
  if (isReturnLikeStatement(next) && isBlockStatement(current)) {
    return true;
  }

  return false;
}

/*
- `Program` ("directives" and "body")
- `BlockStatement`
- `StaticBlock`
- `SwitchCase` ("consequent")
- `TSModuleBlock` (TypeScript)
*/
function printStatementSequence(path, options, print, property) {
  const { node } = path;
  const parts = [];
  const statements = node[property].filter(
    (statement) => statement.type !== "EmptyStatement",
  );
  const lastStatement = statements.at(-1);

  let index = 0;
  path.each(({ node: currentNode }) => {
    // Skip printing EmptyStatement nodes to avoid leaving stray
    // semicolons lying around.
    if (currentNode.type === "EmptyStatement") {
      return;
    }

    parts.push(print());

    if (currentNode !== lastStatement) {
      const nextNode = statements[index + 1];
      const hasBlankLineInSource = isNextLineEmpty(currentNode, options);
      const shouldEnforceBlank =
        nextNode && shouldEnforceBlankLineBetween(currentNode, nextNode);

      // Always add at least one newline
      parts.push(hardline);

      // Add blank line if: exists in source OR we enforce it
      // (This naturally collapses multiple blanks to one)
      if (hasBlankLineInSource || shouldEnforceBlank) {
        parts.push(hardline);
      }
    }

    index++;
  }, property);

  return parts;
}

export { printStatementSequence };
