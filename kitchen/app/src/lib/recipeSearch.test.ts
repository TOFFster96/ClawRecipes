import { describe, expect, test } from "vitest";
import {
  sanitizeQuery,
  filterRecipes,
  segmentRecipesByKind,
  MAX_QUERY_LENGTH,
} from "./recipeSearch";
import type { Recipe } from "../api";

const MOCK_RECIPES: Recipe[] = [
  { id: "dev-team", name: "Development Team", source: "builtin", kind: "team" },
  { id: "agent-pm", name: "Project Manager", source: "builtin", kind: "agent" },
  { id: "agent-dev", name: "Developer Agent", source: "workspace", kind: "agent" },
  { id: "custom-recipe", name: "Custom", source: "workspace", kind: "custom" },
  { id: "legacy", name: "Legacy Team", source: "builtin" },
];

describe("sanitizeQuery", () => {
  test("returns empty string for non-string input", () => {
    expect(sanitizeQuery(null as unknown as string)).toBe("");
    expect(sanitizeQuery(undefined as unknown as string)).toBe("");
    expect(sanitizeQuery(123 as unknown as string)).toBe("");
  });

  test("trims whitespace", () => {
    expect(sanitizeQuery("  dev  ")).toBe("dev");
    expect(sanitizeQuery("\tagent\t")).toBe("agent");
  });

  test("collapses multiple spaces", () => {
    expect(sanitizeQuery("dev   team")).toBe("dev team");
  });

  test("removes control characters", () => {
    expect(sanitizeQuery("dev\x00team")).toBe("devteam");
    expect(sanitizeQuery("a\x01\x02\x03b")).toBe("ab");
    expect(sanitizeQuery("test\x7f")).toBe("test");
  });

  test("preserves newline and tab as space after collapse", () => {
    expect(sanitizeQuery("a\nb")).toBe("a b");
    expect(sanitizeQuery("a\tb")).toBe("a b");
  });

  test("truncates to MAX_QUERY_LENGTH", () => {
    const long = "a".repeat(500);
    expect(sanitizeQuery(long).length).toBe(MAX_QUERY_LENGTH);
    expect(sanitizeQuery(long)).toBe("a".repeat(MAX_QUERY_LENGTH));
  });

  test("returns empty for empty string", () => {
    expect(sanitizeQuery("")).toBe("");
    expect(sanitizeQuery("   ")).toBe("");
  });
});

describe("filterRecipes", () => {
  test("returns all recipes when query empty and kind all", () => {
    expect(filterRecipes(MOCK_RECIPES, "", "all")).toHaveLength(5);
  });

  test("filters by name (case-insensitive)", () => {
    const result = filterRecipes(MOCK_RECIPES, "project", "all");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Project Manager");
  });

  test("filters by id (case-insensitive)", () => {
    const result = filterRecipes(MOCK_RECIPES, "agent-pm", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("agent-pm");
  });

  test("filters by source", () => {
    const result = filterRecipes(MOCK_RECIPES, "workspace", "all");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain("agent-dev");
    expect(result.map((r) => r.id)).toContain("custom-recipe");
  });

  test("filters by kind team", () => {
    const result = filterRecipes(MOCK_RECIPES, "", "team");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain("dev-team");
    expect(result.map((r) => r.id)).toContain("legacy");
  });

  test("filters by kind agent", () => {
    const result = filterRecipes(MOCK_RECIPES, "", "agent");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain("agent-pm");
    expect(result.map((r) => r.id)).toContain("agent-dev");
  });

  test("filters by kind other", () => {
    const result = filterRecipes(MOCK_RECIPES, "", "other");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("custom-recipe");
  });

  test("combines query and kind filter", () => {
    const result = filterRecipes(MOCK_RECIPES, "agent", "agent");
    expect(result).toHaveLength(2);
  });

  test("no match returns empty array", () => {
    expect(filterRecipes(MOCK_RECIPES, "nonexistent", "all")).toHaveLength(0);
  });

  test("sanitizes query before filtering", () => {
    const result = filterRecipes(MOCK_RECIPES, "  dev  ", "all");
    expect(result).toHaveLength(2);
  });
});

describe("segmentRecipesByKind", () => {
  test("splits recipes into team, agent, other", () => {
    const { team, agent, other } = segmentRecipesByKind(MOCK_RECIPES);
    expect(team.map((r) => r.id)).toEqual(["dev-team", "legacy"]);
    expect(agent.map((r) => r.id)).toEqual(["agent-pm", "agent-dev"]);
    expect(other.map((r) => r.id)).toEqual(["custom-recipe"]);
  });
});
