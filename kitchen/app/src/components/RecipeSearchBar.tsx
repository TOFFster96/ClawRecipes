import { Form, InputGroup, Button } from "react-bootstrap";
import type { RecipeKindFilter } from "../lib/recipeSearch";

type RecipeSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  kindFilter: RecipeKindFilter;
  onKindFilterChange: (value: RecipeKindFilter) => void;
  resultCount: number;
  totalCount: number;
  disabled?: boolean;
};

const KIND_OPTIONS: { value: RecipeKindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "team", label: "Team" },
  { value: "agent", label: "Agent" },
  { value: "other", label: "Other" },
];

export function RecipeSearchBar({
  query,
  onQueryChange,
  kindFilter,
  onKindFilterChange,
  resultCount,
  totalCount,
  disabled = false,
}: RecipeSearchBarProps) {
  const isFiltered = query.trim().length > 0 || kindFilter !== "all";
  const showResultCount = isFiltered && totalCount > 0;

  return (
    <div className="mb-3">
      <InputGroup>
        <Form.Control
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, id, or source..."
          disabled={disabled}
          aria-label="Search recipes"
          aria-describedby={showResultCount ? "recipe-search-results" : undefined}
        />
        {query.trim().length > 0 && (
          <Button
            variant="outline-secondary"
            onClick={() => onQueryChange("")}
            disabled={disabled}
            aria-label="Clear search"
          >
            Clear
          </Button>
        )}
      </InputGroup>
      <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
        <Form.Select
          size="sm"
          className="w-auto"
          value={kindFilter}
          onChange={(e) => onKindFilterChange(e.target.value as RecipeKindFilter)}
          disabled={disabled}
          aria-label="Filter by recipe kind"
        >
          {KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Form.Select>
        {showResultCount && (
          <span
            id="recipe-search-results"
            className="text-muted small"
            role="status"
            aria-live="polite"
          >
            {resultCount} of {totalCount} recipe{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
