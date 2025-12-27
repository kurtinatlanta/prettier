import { hardline, indent, softline } from "../../document/index.js";
import hasNewline from "../../utilities/has-newline.js";
import { locEnd, locStart } from "../loc.js";
import { hasComment } from "../utilities/index.js";
import isBlockComment from "../utilities/is-block-comment.js";

function printTryStatement(path, options, print) {
  const { node } = path;
  // Always put finally on its own line
  return [
    "try ",
    print("block"),
    node.handler ? [" ", print("handler")] : "",
    node.finalizer ? [hardline, "finally ", print("finalizer")] : "",
  ];
}

function printCatchClause(path, options, print) {
  const { node } = path;
  if (node.param) {
    const parameterHasComments = hasComment(
      node.param,
      (comment) =>
        !isBlockComment(comment) ||
        (comment.leading &&
          hasNewline(options.originalText, locEnd(comment))) ||
        (comment.trailing &&
          hasNewline(options.originalText, locStart(comment), {
            backwards: true,
          })),
    );
    const param = print("param");

    // Always put catch on its own line
    return [
      hardline,
      "catch ",
      parameterHasComments
        ? ["(", indent([softline, param]), softline, ") "]
        : ["(", param, ") "],
      print("body"),
    ];
  }

  return [hardline, "catch ", print("body")];
}

export { printCatchClause, printTryStatement };
