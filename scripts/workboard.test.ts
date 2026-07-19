import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadWorkItems, renderBoard, validateWorkItems } from "./workboard-lib";

const temporaryDirectories: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "stok-workboard-"));
  temporaryDirectories.push(root);
  mkdirSync(path.join(root, "docs", "work", "items"), { recursive: true });
  return root;
}

function writeItem(
  root: string,
  id: string,
  overrides: Record<string, unknown> = {},
  body = "",
): void {
  const metadata = {
    id,
    title: `Карточка ${id}`,
    status: "В работе",
    kind: "Задача",
    primary: true,
    order: 1,
    dependsOn: [],
    owner: "Codex",
    updated: "2026-07-18",
    nextAction: "Продолжить",
    ...overrides,
  };
  const headings = [
    "Цель",
    "Пользовательский результат",
    "Зависимости",
    "Критерии приёмки",
    "Материалы",
    "Проверки",
    "Ревью",
    "Следующее действие",
  ]
    .map((heading) => `## ${heading}\n\nТекст.`)
    .join("\n\n");
  writeFileSync(
    path.join(root, "docs", "work", "items", `${id}.md`),
    `<!-- WORK_ITEM\n${JSON.stringify(metadata)}\n-->\n\n# ${metadata.title}\n\n${headings}\n${body}`,
    "utf8",
  );
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true });
});

describe("workboard", () => {
  it("loads a valid card and renders the primary task", () => {
    const root = makeRoot();
    writeItem(root, "TASK-001");
    const items = loadWorkItems(root);

    expect(validateWorkItems(items, root)).toEqual([]);
    expect(renderBoard(items)).toContain("`TASK-001` — Карточка TASK-001");
  });

  it("rejects unknown dependencies and multiple primary cards", () => {
    const root = makeRoot();
    writeItem(root, "TASK-001", { dependsOn: ["TASK-404"] });
    writeItem(root, "TASK-002", { order: 2 });
    const failures = validateWorkItems(loadWorkItems(root), root);

    expect(failures).toContain("TASK-001: неизвестная зависимость TASK-404");
    expect(failures).toContain("Должна быть ровно одна главная карточка; найдено 2");
  });

  it("requires review and evidence before a card is done", () => {
    const root = makeRoot();
    writeItem(root, "TASK-001", { status: "Готово" });
    const failures = validateWorkItems(loadWorkItems(root), root);

    expect(failures).toContain("TASK-001: готовая карточка не имеет ревью");
    expect(failures).toContain("TASK-001: готовая карточка не имеет доказательств");
  });
});
