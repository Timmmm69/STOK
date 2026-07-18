import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format } from "prettier";

import { loadWorkItems, renderBoard, validateWorkItems } from "./workboard-lib";

const root = process.cwd();
const boardPath = path.join(root, "docs", "work", "BOARD.md");
const command = process.argv[2] ?? "check";
const items = loadWorkItems(root);
const failures = validateWorkItems(items, root);
const renderedBoard = await format(renderBoard(items), { parser: "markdown" });

if (failures.length > 0) {
  for (const failure of failures) console.error(`WORKBOARD ERROR: ${failure}`);
  process.exitCode = 1;
} else if (command === "render") {
  writeFileSync(boardPath, renderedBoard, "utf8");
  console.log(`Доска обновлена: ${items.length} карточек.`);
} else if (command === "check") {
  const expected = renderedBoard;
  const actual = readFileSync(boardPath, "utf8").replaceAll("\r\n", "\n");
  if (actual !== expected) {
    console.error("WORKBOARD ERROR: BOARD.md устарел; выполните pnpm work:render");
    process.exitCode = 1;
  } else {
    console.log(`Доска корректна: ${items.length} карточек, одна главная.`);
  }
} else {
  console.error(`Неизвестная команда: ${command}. Используйте check или render.`);
  process.exitCode = 1;
}
