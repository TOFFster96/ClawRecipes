#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitchenDir = path.resolve(__dirname, "..", "kitchen");

const pkgPath = path.join(kitchenDir, "package.json");
if (!fs.existsSync(pkgPath)) {
  console.error("ClawRecipes Kitchen not found. Is the package installed correctly?");
  process.exitCode = 1;
  process.exit(1);
}

const nodeModulesPath = path.join(kitchenDir, "node_modules");
if (!fs.existsSync(nodeModulesPath)) {
  console.error("Installing Kitchen dependencies...");
  const installRes = spawnSync("npm", ["install"], {
    cwd: kitchenDir,
    stdio: "inherit",
    shell: true,
  });
  if (installRes.status !== 0) {
    process.exitCode = installRes.status ?? 1;
    process.exit(process.exitCode);
  }
}

const appDir = path.join(kitchenDir, "app");
const appPkgPath = path.join(appDir, "package.json");
const appNodeModulesPath = path.join(appDir, "node_modules");
if (fs.existsSync(appPkgPath) && !fs.existsSync(appNodeModulesPath)) {
  console.error("Installing Kitchen app dependencies...");
  const appInstallRes = spawnSync("npm", ["install"], {
    cwd: appDir,
    stdio: "inherit",
    shell: true,
  });
  if (appInstallRes.status !== 0) {
    process.exitCode = appInstallRes.status ?? 1;
    process.exit(process.exitCode);
  }
}

const res = spawnSync("npm", ["run", "prod"], {
  cwd: kitchenDir,
  stdio: "inherit",
  shell: true,
});
process.exitCode = res.status ?? 1;
process.exit(process.exitCode);
