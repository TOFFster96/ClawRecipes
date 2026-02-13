import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";

// Regression guard: OpenClaw flags plugins that use child_process patterns.
// We explicitly forbid importing child_process in the plugin entry.

describe("security guardrails", () => {
  test("plugin does not reference node:child_process", async () => {
    const entry = path.resolve(__dirname, "..", "index.ts");
    const text = await fs.readFile(entry, "utf8");

    expect(text).not.toMatch(/node:child_process/);
    expect(text).not.toMatch(/\bchild_process\b/);
    expect(text).not.toMatch(/\bspawnSync\b/);
    expect(text).not.toMatch(/\bexecFile\b/);
    expect(text).not.toMatch(/\bexec\b/);
  });
});
