import { hardline } from "../../document/index.js";
import { isNextLineEmpty } from "../utilities/index.js";

/**
 * @import {Doc} from "../../document/index.js"
 * @import AstPath from "../../common/ast-path.js")
 */

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

// Determine if we should enforce a blank line between two statements
function shouldEnforceBlankLineBetween(current, next) {
  // Always add blank line after imports/exports when followed by non-import/export
  if (isImportOrExport(current) && !isImportOrExport(next)) {
    return true;
  }

  // Add blank line between top-level declarations
  if (isTopLevelDeclaration(current) && isTopLevelDeclaration(next)) {
    return true;
  }

  // Add blank line before top-level declarations (unless preceded by import/export)
  if (!isImportOrExport(current) && isTopLevelDeclaration(next)) {
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
