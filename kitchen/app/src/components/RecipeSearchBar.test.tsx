import { describe, expect, test, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeSearchBar } from "./RecipeSearchBar";

afterEach(() => cleanup());

describe("RecipeSearchBar", () => {
  const defaultProps = {
    query: "",
    onQueryChange: vi.fn(),
    kindFilter: "all" as const,
    onKindFilterChange: vi.fn(),
    resultCount: 5,
    totalCount: 5,
  };

  test("renders search input with accessible label", () => {
    render(<RecipeSearchBar {...defaultProps} />);
    const input = screen.getByLabelText("Search recipes");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search by name, id, or source...");
  });

  test("renders kind filter select", () => {
    render(<RecipeSearchBar {...defaultProps} />);
    const select = screen.getByLabelText("Filter by recipe kind");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("all");
  });

  test("does not show result count when not filtered", () => {
    render(<RecipeSearchBar {...defaultProps} />);
    expect(screen.queryByText(/of \d+ recipe/)).not.toBeInTheDocument();
  });

  test("shows result count when query is active", () => {
    render(<RecipeSearchBar {...defaultProps} query="dev" resultCount={2} totalCount={5} />);
    expect(screen.getByText("2 of 5 recipes")).toBeInTheDocument();
  });

  test("shows result count when kind filter is not all", () => {
    render(
      <RecipeSearchBar {...defaultProps} kindFilter="agent" resultCount={2} totalCount={5} />
    );
    expect(screen.getByText("2 of 5 recipes")).toBeInTheDocument();
  });

  test("shows singular recipe when totalCount is 1", () => {
    render(<RecipeSearchBar {...defaultProps} query="x" resultCount={1} totalCount={1} />);
    expect(screen.getByText("1 of 1 recipe")).toBeInTheDocument();
  });

  test("calls onQueryChange when typing", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();
    render(<RecipeSearchBar {...defaultProps} onQueryChange={onQueryChange} />);
    await user.type(screen.getByLabelText("Search recipes"), "dev");
    expect(onQueryChange).toHaveBeenCalled();
    expect(onQueryChange.mock.calls.every((c) => typeof c[0] === "string")).toBe(true);
  });

  test("calls onKindFilterChange when selecting kind", async () => {
    const onKindFilterChange = vi.fn();
    const user = userEvent.setup();
    render(<RecipeSearchBar {...defaultProps} onKindFilterChange={onKindFilterChange} />);
    await user.selectOptions(
      screen.getByLabelText("Filter by recipe kind"),
      "agent"
    );
    expect(onKindFilterChange).toHaveBeenCalledWith("agent");
  });

  test("shows Clear button when query has content", () => {
    render(<RecipeSearchBar {...defaultProps} query="dev" />);
    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    expect(clearBtn).toBeInTheDocument();
  });

  test("Clear button calls onQueryChange with empty string", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();
    render(<RecipeSearchBar {...defaultProps} query="dev" onQueryChange={onQueryChange} />);
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onQueryChange).toHaveBeenCalledWith("");
  });

  test("disabled prop disables input and select", () => {
    render(<RecipeSearchBar {...defaultProps} disabled />);
    expect(screen.getByLabelText("Search recipes")).toBeDisabled();
    expect(screen.getByLabelText("Filter by recipe kind")).toBeDisabled();
  });
});
