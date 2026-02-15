import { Card, Button } from "react-bootstrap";
import type { Recipe, RecipeStatus } from "../api";

type RecipeCardProps = {
  recipe: Recipe;
  status?: RecipeStatus;
  onSelect: () => void;
  onScaffoldTeam?: () => void;
  onScaffoldAgent?: () => void;
  onInstallSkills?: () => void;
  installing?: boolean;
};

export function RecipeCard({
  recipe,
  status,
  onSelect,
  onScaffoldTeam,
  onScaffoldAgent,
  onInstallSkills,
  installing = false,
}: RecipeCardProps) {
  const missingSkills = status?.missingSkills ?? [];

  return (
    <Card className="h-100 recipe-card" onClick={onSelect}>
      <Card.Body className="py-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-medium">{recipe.name ?? recipe.id}</span>
          {missingSkills.length > 0 && (
            <span
              className="badge bg-warning text-dark"
              title={`Missing skills: ${missingSkills.join(", ")}`}
            >
              {missingSkills.length} missing
            </span>
          )}
        </div>
        <small className="text-muted">
          {recipe.id} · {recipe.source}
        </small>
        <div className="mt-2 d-flex flex-wrap gap-1">
          {onScaffoldTeam && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onScaffoldTeam();
              }}
            >
              Scaffold team
            </Button>
          )}
          {onScaffoldAgent && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onScaffoldAgent();
              }}
            >
              Scaffold agent
            </Button>
          )}
          {onInstallSkills && missingSkills.length > 0 && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onInstallSkills();
              }}
              disabled={installing}
            >
              {installing ? "Installing…" : "Install skills"}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
