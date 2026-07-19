import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const WORK_STATUSES = [
  "Очередь",
  "Нужно решение",
  "Проектирование",
  "Готово к разработке",
  "В работе",
  "Проверка",
  "Ждёт владельца",
  "Заблокировано",
  "Готово",
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export type WorkItemMetadata = {
  id: string;
  title: string;
  status: WorkStatus;
  kind: "Направление" | "Срез" | "Задача";
  primary: boolean;
  order: number;
  dependsOn: string[];
  owner: string;
  updated: string;
  nextAction: string;
  review?: string;
  evidence?: string[];
};

export type WorkItem = WorkItemMetadata & {
  filePath: string;
  relativePath: string;
  markdown: string;
};

const requiredHeadings = [
  "## Цель",
  "## Пользовательский результат",
  "## Зависимости",
  "## Критерии приёмки",
  "## Материалы",
  "## Проверки",
  "## Ревью",
  "## Следующее действие",
];

const metadataPattern = /<!--\s*WORK_ITEM\s*(\{[\s\S]*?\})\s*-->/;
const idPattern = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseMetadata(markdown: string, filePath: string): WorkItemMetadata {
  const match = markdown.match(metadataPattern);
  if (!match?.[1]) {
    throw new Error(`${filePath}: отсутствует блок WORK_ITEM`);
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${filePath}: неверный JSON в WORK_ITEM`, { cause: error });
  }

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new Error(`${filePath}: WORK_ITEM должен быть объектом`);
  }

  return candidate as WorkItemMetadata;
}

export function parseWorkItem(filePath: string, root: string): WorkItem {
  const markdown = readFileSync(filePath, "utf8");
  return {
    ...parseMetadata(markdown, filePath),
    filePath,
    relativePath: path.relative(root, filePath).split(path.sep).join("/"),
    markdown,
  };
}

export function loadWorkItems(root: string): WorkItem[] {
  const itemsDirectory = path.join(root, "docs", "work", "items");
  if (!existsSync(itemsDirectory)) {
    throw new Error(`Каталог карточек не найден: ${itemsDirectory}`);
  }

  return readdirSync(itemsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => parseWorkItem(path.join(itemsDirectory, entry.name), root))
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

function validateShape(item: WorkItem): string[] {
  const failures: string[] = [];
  const expectedFileName = `${item.id}.md`;

  if (!idPattern.test(item.id)) failures.push(`${item.relativePath}: неверный ID ${item.id}`);
  if (path.basename(item.filePath) !== expectedFileName) {
    failures.push(`${item.relativePath}: имя файла должно быть ${expectedFileName}`);
  }
  if (!item.title?.trim()) failures.push(`${item.id}: отсутствует название`);
  if (!WORK_STATUSES.includes(item.status)) failures.push(`${item.id}: неизвестное состояние`);
  if (!["Направление", "Срез", "Задача"].includes(item.kind)) {
    failures.push(`${item.id}: неизвестный тип`);
  }
  if (typeof item.primary !== "boolean") failures.push(`${item.id}: primary должен быть boolean`);
  if (!Number.isInteger(item.order) || item.order < 0) failures.push(`${item.id}: неверный order`);
  if (!Array.isArray(item.dependsOn)) failures.push(`${item.id}: dependsOn должен быть массивом`);
  if (!item.owner?.trim()) failures.push(`${item.id}: отсутствует ответственный`);
  if (!datePattern.test(item.updated)) failures.push(`${item.id}: неверная дата updated`);
  if (!item.nextAction?.trim()) failures.push(`${item.id}: отсутствует следующее действие`);

  for (const heading of requiredHeadings) {
    if (!item.markdown.includes(heading))
      failures.push(`${item.id}: отсутствует раздел ${heading}`);
  }

  if (item.status === "Готово") {
    if (!item.review?.trim()) failures.push(`${item.id}: готовая карточка не имеет ревью`);
    if (!item.evidence?.length)
      failures.push(`${item.id}: готовая карточка не имеет доказательств`);
  }

  return failures;
}

function cycleFailures(items: WorkItem[]): string[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const failures: string[] = [];

  function visit(id: string, trail: string[]): void {
    if (visiting.has(id)) {
      failures.push(`Цикл зависимостей: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;

    visiting.add(id);
    const item = byId.get(id);
    for (const dependency of item?.dependsOn ?? []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  }

  for (const item of items) visit(item.id, []);
  return failures;
}

export function validateWorkItems(items: WorkItem[], root: string): string[] {
  const failures = items.flatMap(validateShape);
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  for (const [id, count] of counts) if (count > 1) failures.push(`Повторяющийся ID: ${id}`);

  const ids = new Set(items.map((item) => item.id));
  for (const item of items) {
    for (const dependency of item.dependsOn) {
      if (!ids.has(dependency)) failures.push(`${item.id}: неизвестная зависимость ${dependency}`);
      if (dependency === item.id) failures.push(`${item.id}: карточка зависит сама от себя`);
    }
    if (item.review && !existsSync(path.join(root, item.review))) {
      failures.push(`${item.id}: файл ревью не найден ${item.review}`);
    }
  }

  const primary = items.filter((item) => item.primary);
  if (primary.length !== 1)
    failures.push(`Должна быть ровно одна главная карточка; найдено ${primary.length}`);

  failures.push(...cycleFailures(items));
  return [...new Set(failures)];
}

export function renderBoard(items: WorkItem[]): string {
  const counts = new Map(WORK_STATUSES.map((status) => [status, 0]));
  for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  const primary = items.find((item) => item.primary);
  const primaryLink = primary
    ? "[`" + primary.id + "` — " + primary.title + "](items/" + primary.id + ".md)"
    : "не определена";

  const lines = [
    "# Доска работ STOK",
    "",
    "Статус: создаётся автоматически из `docs/work/items/*.md`. Карточки и репозиторий — источник истины; GitHub Project является наглядной копией.",
    "",
    `Главная карточка: ${primaryLink}.`,
    "",
    "| Состояние | Количество |",
    "| --- | ---: |",
    ...WORK_STATUSES.map((status) => `| ${status} | ${counts.get(status) ?? 0} |`),
    "",
  ];

  for (const status of WORK_STATUSES) {
    lines.push(`## ${status}`, "");
    const matching = items.filter((item) => item.status === status);
    if (matching.length === 0) {
      lines.push("_Нет карточек._", "");
      continue;
    }

    lines.push(
      "| Карточка | Тип | Ответственный | Следующее действие |",
      "| --- | --- | --- | --- |",
    );
    for (const item of matching) {
      const marker = item.primary ? " **← главная**" : "";
      lines.push(
        "| [`" +
          item.id +
          "` — " +
          item.title +
          "](items/" +
          item.id +
          ".md)" +
          marker +
          " | " +
          item.kind +
          " | " +
          item.owner +
          " | " +
          item.nextAction +
          " |",
      );
    }
    lines.push("");
  }

  lines.push(
    "## Правило работы",
    "",
    "Новый чат начинает с `AGENTS.md` → этой доски → `HANDOFF.md` → главной карточки → активного плана. Изменение состояния сначала фиксируется в карточке и Git, затем отправляется в GitHub командой `pnpm work:github:apply`.",
    "",
  );

  return `${lines.join("\n")}\n`;
}
