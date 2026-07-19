import { execFileSync } from "node:child_process";

import { loadWorkItems, validateWorkItems, WORK_STATUSES, type WorkItem } from "./workboard-lib";

const repository = "Timmmm69/STOK";
const owner = "Timmmm69";
const projectTitle = "STOK — разработка";
const markerPrefix = "<!-- STOK_WORK_ITEM:";
const command = process.argv[2] ?? "plan";
const apply = command === "apply";

type Issue = {
  number: number;
  title: string;
  body: string;
  state: "OPEN" | "CLOSED";
  url: string;
};

type Project = { id: string; number: number; title: string; url: string };
type ProjectField = { id: string; name: string; options?: Array<{ id: string; name: string }> };
type ProjectItem = {
  id: string;
  content?: { number?: number; repository?: string; url?: string };
};

function gh(args: string[]): string {
  try {
    return execFileSync("gh", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${detail}\nДля GitHub Project нужны разрешения: gh auth refresh -s project`, {
      cause: error,
    });
  }
}

function ghJson<T>(args: string[]): T {
  const output = gh(args);
  return (output ? JSON.parse(output) : {}) as T;
}

function issueTitle(item: WorkItem): string {
  return `[${item.id}] ${item.title}`;
}

function issueBody(item: WorkItem): string {
  return [
    `${markerPrefix}${item.id} -->`,
    "",
    `**Состояние в репозитории:** ${item.status}`,
    `**Ответственный:** ${item.owner}`,
    `**Главный источник:** [${item.relativePath}](https://github.com/${repository}/blob/main/${item.relativePath})`,
    "",
    "## Следующее действие",
    "",
    item.nextAction,
    "",
    "Состояние этой задачи меняется сначала в репозитории, затем обновляется односторонней синхронизацией.",
  ].join("\n");
}

function itemIdFromBody(body: string): string | null {
  const match = body.match(/<!-- STOK_WORK_ITEM:([A-Z0-9-]+) -->/);
  return match?.[1] ?? null;
}

function listIssues(): Issue[] {
  return ghJson<Issue[]>([
    "issue",
    "list",
    "--repo",
    repository,
    "--state",
    "all",
    "--label",
    "work-item",
    "--limit",
    "1000",
    "--json",
    "number,title,body,state,url",
  ]);
}

function listProjects(): Project[] {
  return ghJson<{ projects: Project[] }>([
    "project",
    "list",
    "--owner",
    owner,
    "--limit",
    "100",
    "--format",
    "json",
  ]).projects;
}

function createProject(): Project {
  return ghJson<Project>([
    "project",
    "create",
    "--owner",
    owner,
    "--title",
    projectTitle,
    "--format",
    "json",
  ]);
}

function ensureLabel(): void {
  gh([
    "label",
    "create",
    "work-item",
    "--repo",
    repository,
    "--color",
    "2F6FEB",
    "--description",
    "Карточка из главной доски репозитория STOK",
    "--force",
  ]);
}

function createIssue(item: WorkItem): Issue {
  const url = gh([
    "issue",
    "create",
    "--repo",
    repository,
    "--title",
    issueTitle(item),
    "--body",
    issueBody(item),
    "--label",
    "work-item",
  ]);
  const number = Number(url.split("/").at(-1));
  return { number, title: issueTitle(item), body: issueBody(item), state: "OPEN", url };
}

function updateIssue(issue: Issue, item: WorkItem): void {
  gh([
    "issue",
    "edit",
    String(issue.number),
    "--repo",
    repository,
    "--title",
    issueTitle(item),
    "--body",
    issueBody(item),
  ]);

  if (item.status === "Готово" && issue.state !== "CLOSED") {
    gh(["issue", "close", String(issue.number), "--repo", repository]);
  } else if (item.status !== "Готово" && issue.state === "CLOSED") {
    gh(["issue", "reopen", String(issue.number), "--repo", repository]);
  }
}

function ensureStatusField(project: Project): ProjectField {
  const fields = ghJson<{ fields: ProjectField[] }>([
    "project",
    "field-list",
    String(project.number),
    "--owner",
    owner,
    "--format",
    "json",
  ]).fields;
  const existing = fields.find((field) => field.name === "Состояние STOK");
  if (existing) return existing;

  return ghJson<ProjectField>([
    "project",
    "field-create",
    String(project.number),
    "--owner",
    owner,
    "--name",
    "Состояние STOK",
    "--data-type",
    "SINGLE_SELECT",
    "--single-select-options",
    WORK_STATUSES.join(","),
    "--format",
    "json",
  ]);
}

function addAndIndexProjectItems(project: Project, issues: Issue[]): Map<number, ProjectItem> {
  for (const issue of issues) {
    gh(["project", "item-add", String(project.number), "--owner", owner, "--url", issue.url]);
  }

  let indexed = new Map<number, ProjectItem>();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const projectItems = ghJson<{ items: ProjectItem[] }>([
      "project",
      "item-list",
      String(project.number),
      "--owner",
      owner,
      "--limit",
      "1000",
      "--format",
      "json",
    ]).items;
    indexed = new Map(
      projectItems
        .filter((item) => item.content?.repository === repository && item.content.number)
        .map((item) => [item.content!.number!, item]),
    );
    if (issues.every((issue) => indexed.has(issue.number))) return indexed;
  }
  return indexed;
}

function updateProjectStatus(
  project: Project,
  field: ProjectField,
  projectItem: ProjectItem,
  workItem: WorkItem,
): void {
  const option = field.options?.find((candidate) => candidate.name === workItem.status);
  if (!option) throw new Error(`В поле GitHub нет состояния ${workItem.status}`);
  gh([
    "project",
    "item-edit",
    "--id",
    projectItem.id,
    "--project-id",
    project.id,
    "--field-id",
    field.id,
    "--single-select-option-id",
    option.id,
  ]);
}

if (!apply && command !== "plan") {
  console.error("Используйте plan или apply.");
  process.exitCode = 1;
} else {
  const root = process.cwd();
  const items = loadWorkItems(root);
  const failures = validateWorkItems(items, root);
  if (failures.length) {
    for (const failure of failures) console.error(`WORKBOARD ERROR: ${failure}`);
    process.exitCode = 1;
  } else {
    const issues = listIssues();
    const issuesById = new Map<string, Issue>();
    for (const issue of issues) {
      const id = itemIdFromBody(issue.body);
      if (id) issuesById.set(id, issue);
    }
    const projects = listProjects();
    const project = projects.find((candidate) => candidate.title === projectTitle);
    const creates = items.filter((item) => !issuesById.has(item.id));
    const updates = items.filter((item) => {
      const issue = issuesById.get(item.id);
      return (
        issue &&
        (issue.title !== issueTitle(item) ||
          issue.body !== issueBody(item) ||
          (item.status === "Готово") !== (issue.state === "CLOSED"))
      );
    });

    console.log(
      `GitHub preview: project=${project ? project.url : "create"}, create=${creates.length}, update=${updates.length}, unchanged=${items.length - creates.length - updates.length}.`,
    );

    if (apply) {
      ensureLabel();
      const activeProject = project ?? createProject();
      const field = ensureStatusField(activeProject);
      const synchronizedIssues: Issue[] = [];
      for (const item of items) {
        const existing = issuesById.get(item.id);
        if (existing) {
          if (updates.includes(item)) updateIssue(existing, item);
          synchronizedIssues.push({ ...existing, title: issueTitle(item), body: issueBody(item) });
        } else {
          synchronizedIssues.push(createIssue(item));
        }
      }

      const projectItems = addAndIndexProjectItems(activeProject, synchronizedIssues);
      for (const item of items) {
        const issue = synchronizedIssues.find(
          (candidate) => itemIdFromBody(candidate.body) === item.id,
        );
        const projectItem = issue ? projectItems.get(issue.number) : undefined;
        if (!projectItem) throw new Error(`Задача ${item.id} не найдена в GitHub Project`);
        updateProjectStatus(activeProject, field, projectItem, item);
      }
      console.log(`GitHub Project обновлён: ${activeProject.url}`);
    }
  }
}
