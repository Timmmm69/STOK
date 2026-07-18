import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "playwright-report",
  "test-results",
]);

const requiredDocuments = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/references/product-concept-v1.md",
  "docs/product/PRODUCT_COMPASS.md",
  "docs/product/PRODUCT_OVERVIEW.md",
  "docs/product/PILOT_SCOPE.md",
  "docs/product/USERS_AND_JOBS.md",
  "docs/product/USER_FLOWS.md",
  "docs/product/BUSINESS_RULES.md",
  "docs/product/METRICS.md",
  "docs/product/DATA_QUALITY.md",
  "docs/product/ROADMAP.md",
  "docs/product/RISKS_AND_HYPOTHESES.md",
  "docs/product/OPEN_QUESTIONS.md",
  "docs/product/IMPLEMENTATION_SEQUENCE.md",
  "docs/work/BOARD.md",
  "docs/work/HANDOFF.md",
  "docs/design/PILOT_SCREEN_MAP.md",
  "docs/architecture/SYSTEM_CONTEXT.md",
  "docs/architecture/DOMAIN_MODEL.md",
  "docs/architecture/DATA_MODEL.md",
  "docs/architecture/MODULE_BOUNDARIES.md",
  "docs/architecture/SECURITY.md",
  "docs/architecture/RELIABILITY.md",
  "docs/architecture/OBSERVABILITY.md",
  "docs/architecture/PRINTING_STRATEGY.md",
  "docs/architecture/OFFLINE_STRATEGY.md",
  "docs/architecture/AI_BOUNDARIES.md",
  "docs/architecture/EVOLUTION_STRATEGY.md",
  "docs/runbooks/LOCAL_SETUP.md",
  "docs/runbooks/GOOGLE_LOGIN_SETUP.md",
  "docs/runbooks/DATABASE_OPERATIONS.md",
  "docs/runbooks/DATABASE_RECOVERY.md",
  "docs/runbooks/TESTING_LOCALLY.md",
  "docs/runbooks/TROUBLESHOOTING.md",
  "docs/quality/TESTING_STRATEGY.md",
  "docs/quality/DEFINITION_OF_DONE.md",
  "docs/quality/CODE_REVIEW.md",
  "docs/quality/ARCHITECTURE_RULES.md",
];

const failures: string[] = [];

function normalize(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function walk(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
    } else if (entry.isFile()) {
      files.push(normalize(path.relative(repositoryRoot, absolutePath)));
    }
  }

  return files;
}

function candidateFiles(): string[] {
  try {
    const executable = process.env.GIT_EXECUTABLE ?? "git";
    const output = execFileSync(
      executable,
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return output.split("\0").filter(Boolean).map(normalize);
  } catch {
    return walk(repositoryRoot);
  }
}

for (const requiredDocument of requiredDocuments) {
  if (!existsSync(path.join(repositoryRoot, requiredDocument))) {
    failures.push(`Missing required document: ${requiredDocument}`);
  }
}

const files = candidateFiles();
const forbiddenEnvironmentFiles = files.filter((file) => {
  const name = path.posix.basename(file);
  return name.startsWith(".env") && name !== ".env.example";
});

for (const file of forbiddenEnvironmentFiles) {
  failures.push(`Environment file must not be committed: ${file}`);
}

const secretPatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", pattern: /gh[opsu]_[A-Za-z0-9]{36,255}/ },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
];

for (const file of files) {
  const absolutePath = path.join(repositoryRoot, file);
  if (!existsSync(absolutePath) || statSync(absolutePath).size > 1_000_000) {
    continue;
  }

  const content = readFileSync(absolutePath, "utf8");
  for (const secret of secretPatterns) {
    if (secret.pattern.test(content)) {
      failures.push(`Possible ${secret.name} in ${file}`);
    }
  }
}

const migrationsRoot = path.join(repositoryRoot, "prisma", "migrations");
if (!existsSync(path.join(migrationsRoot, "migration_lock.toml"))) {
  failures.push("Missing Prisma migration lock file");
}

const migrationDirectories = existsSync(migrationsRoot)
  ? readdirSync(migrationsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];

if (migrationDirectories.length === 0) {
  failures.push("At least one Prisma migration is required");
}

for (const migration of migrationDirectories) {
  const migrationFile = path.join(migrationsRoot, migration.name, "migration.sql");
  if (!existsSync(migrationFile) || readFileSync(migrationFile, "utf8").trim().length === 0) {
    failures.push(`Migration is missing SQL: ${migration.name}`);
  }
}

const sourceFiles = files.filter((file) => /^src\/.*\.[cm]?[jt]sx?$/.test(file));
const importPattern = /\b(?:import|export)\s+(?:[^;"']*?\s+from\s+)?["']([^"']+)["']/g;

for (const sourceFile of sourceFiles) {
  const sourceModule = sourceFile.match(/^src\/modules\/([^/]+)\//)?.[1];
  if (!sourceModule) {
    continue;
  }

  const content = readFileSync(path.join(repositoryRoot, sourceFile), "utf8");
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier) {
      continue;
    }

    let destination: string | undefined;
    if (specifier.startsWith("@/")) {
      destination = `src/${specifier.slice(2)}`;
    } else if (specifier.startsWith(".")) {
      destination = normalize(path.resolve(path.dirname(sourceFile), specifier));
      destination = normalize(path.relative(repositoryRoot, destination));
    }

    const destinationModule = destination?.match(/^src\/modules\/([^/]+)(?:\/|$)/)?.[1];
    if (!destinationModule || destinationModule === sourceModule) {
      continue;
    }

    const publicImports = new Set([
      `@/modules/${destinationModule}`,
      `@/modules/${destinationModule}/index`,
    ]);
    if (!publicImports.has(specifier)) {
      failures.push(
        `Deep cross-module import from ${sourceModule} to ${destinationModule}: ${sourceFile}`,
      );
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`QUALITY ERROR: ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Quality checks passed: ${requiredDocuments.length} documents, ${migrationDirectories.length} migration(s), ${files.length} repository file(s).`,
  );
}
