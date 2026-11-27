import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const rootDirectory = process.cwd();
const ignoredDirectories = new Set(["node_modules", "dist", ".git", ".worktrees"]);
const checkedExtensions = [".ts", ".tsx", ".js", ".mjs"];

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return ignoredDirectories.has(entry) ? [] : listSourceFiles(path);
    }
    return checkedExtensions.some((extension) => path.endsWith(extension)) ? [path] : [];
  });
}

function findCommentPositions(text: string, path: string): number[] {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const positions = new Set<number>();
  const collect = (ranges: ts.CommentRange[] | undefined) =>
    ranges?.forEach((range) => positions.add(range.pos));
  const visit = (node: ts.Node) => {
    collect(ts.getLeadingCommentRanges(text, node.getFullStart()));
    collect(ts.getTrailingCommentRanges(text, node.getEnd()));
    node.getChildren(sourceFile).forEach(visit);
  };
  visit(sourceFile);
  collect(ts.getLeadingCommentRanges(text, sourceFile.endOfFileToken.getFullStart()));
  return [...positions].sort((a, b) => a - b);
}

function lineOf(text: string, position: number): number {
  return text.slice(0, position).split("\n").length;
}

const violations = listSourceFiles(rootDirectory).flatMap((path) => {
  const text = readFileSync(path, "utf8");
  return findCommentPositions(text, path).map(
    (position) => `${relative(rootDirectory, path)}:${lineOf(text, position)}`,
  );
});

if (violations.length > 0) {
  console.error(`Comments found:\n${violations.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("No comments found");
}
