/**
 * Client-side recipe search with input sanitization for security.
 * Never passes user input to the server; filters in-memory data only.
 */
import type { Recipe } from "../api";

/** Maximum query length to prevent performance issues and excessive input. */
export const MAX_QUERY_LENGTH = 200;

/** Kind filter: "all" matches any; otherwise filter by recipe.kind. */
export type RecipeKindFilter = "all" | "team" | "agent" | "other";

/** Control chars and null bytes that could cause issues (excluding newline/tab). */
const CONTROL_CHAR_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/**
 * Sanitizes search query for safe client-side use.
 * - Trims and collapses whitespace
 * - Removes control characters
 * - Truncates to MAX_QUERY_LENGTH
 */
export function sanitizeQuery(raw: string): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(CONTROL_CHAR_RE, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

/**
 * Filters recipes by query (matches id, name, source) and optional kind.
 * Uses case-insensitive substring match. No regex from user input (avoids ReDoS).
 */
export function filterRecipes(
  recipes: Recipe[],
  query: string,
  kindFilter: RecipeKindFilter = "all"
): Recipe[] {
  const q = sanitizeQuery(query).toLowerCase();
  const hasQuery = q.length > 0;

  const matchesKind = (r: Recipe): boolean => {
    if (kindFilter === "all") return true;
    if (kindFilter === "team") return r.kind === "team" || !r.kind;
    if (kindFilter === "agent") return r.kind === "agent";
    if (kindFilter === "other") return !!r.kind && r.kind !== "team" && r.kind !== "agent";
    return true;
  };

  const matchesQuery = (r: Recipe): boolean => {
    if (!hasQuery) return true;
    const id = (r.id ?? "").toLowerCase();
    const name = (r.name ?? "").toLowerCase();
    const source = (r.source ?? "").toLowerCase();
    return id.includes(q) || name.includes(q) || source.includes(q);
  };

  return recipes.filter((r) => matchesKind(r) && matchesQuery(r));
}

/**
 * Segments recipes into team, agent, and other for display.
 * Exported for reuse in RecipesPage.
 */
export function segmentRecipesByKind(
  recipes: Recipe[]
): { team: Recipe[]; agent: Recipe[]; other: Recipe[] } {
  const team = recipes.filter((r) => r.kind === "team" || !r.kind);
  const agent = recipes.filter((r) => r.kind === "agent");
  const other = recipes.filter(
    (r) => !!r.kind && r.kind !== "team" && r.kind !== "agent"
  );
  return { team, agent, other };
}
