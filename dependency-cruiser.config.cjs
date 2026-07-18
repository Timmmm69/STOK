/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular-dependencies",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-app-to-database",
      severity: "error",
      from: { path: "^src/app" },
      to: { path: "^src/(generated/prisma|infrastructure/database)" },
    },
    {
      name: "no-domain-to-framework",
      severity: "error",
      from: { path: "^src/modules/[^/]+/(domain|application)" },
      to: { path: "^(node_modules/)?(next|react|@prisma)|^src/(app|infrastructure)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["types", "import", "node", "default"],
    },
    exclude: "(^|/)(node_modules|src/generated/prisma)(/|$)",
  },
};
