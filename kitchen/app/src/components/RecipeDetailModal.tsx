import { Modal, Button } from "react-bootstrap";
import { RecipeContent } from "./RecipeContent";
import { LoadingSpinner } from "./LoadingSpinner";
import type { Recipe, RecipeStatus } from "../api";

type RecipeDetailModalProps = {
  recipe: Recipe;
  md: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  status: RecipeStatus | undefined;
  installError: string | null;
  installing: boolean;
  onInstallSkills: (recipeId: string) => void;
  onScaffoldTeam: () => void;
  onScaffoldAgent: () => void;
  onClose: () => void;
};

export function RecipeDetailModal({
  recipe,
  md,
  loading,
  error,
  onRetry,
  status,
  installError,
  installing,
  onInstallSkills,
  onScaffoldTeam,
  onScaffoldAgent,
  onClose,
}: RecipeDetailModalProps) {
  const missingSkills = status?.missingSkills ?? [];
  const showScaffoldTeam = recipe.kind === "team" || !recipe.kind;
  const showScaffoldAgent = recipe.kind === "agent";

  return (
    <Modal show onHide={onClose} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{recipe.name ?? recipe.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <LoadingSpinner message="Loading..." />}
        {error && !loading && (
          <div className="alert alert-danger" role="alert">
            <p className="mb-2">{error}</p>
            <Button variant="primary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
        {installError && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {installError}
          </div>
        )}
        {missingSkills.length > 0 && (
          <div className="alert alert-warning py-2 mb-3" role="alert">
            <strong>Missing skills:</strong> {missingSkills.join(", ")}
            <div className="mt-2">
              <Button
                variant="warning"
                size="sm"
                onClick={() => onInstallSkills(recipe.id)}
                disabled={installing}
              >
                {installing ? "Installing…" : "Install skills"}
              </Button>
            </div>
            {status?.installCommands?.length > 0 && (
              <pre className="mt-2 mb-0 small bg-dark text-light p-2 rounded">
                {status.installCommands.join("\n")}
              </pre>
            )}
          </div>
        )}
        {md && !loading && !error && <RecipeContent md={md} />}
        {showScaffoldTeam && md && !error && (
          <div className="mt-3">
            <Button variant="primary" size="sm" onClick={onScaffoldTeam}>
              Scaffold team
            </Button>
          </div>
        )}
        {showScaffoldAgent && md && !error && (
          <div className="mt-3">
            <Button variant="primary" size="sm" onClick={onScaffoldAgent}>
              Scaffold agent
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
