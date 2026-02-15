import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import type { Recipe } from "../api";
import { useFormSubmit } from "../hooks/useFormSubmit";

type ScaffoldTeamModalProps = {
  recipe: Recipe;
  onScaffold: (teamId: string, overwrite: boolean) => Promise<void>;
  onClose: () => void;
};

export function ScaffoldTeamModal({ recipe, onScaffold, onClose }: ScaffoldTeamModalProps) {
  const [teamId, setTeamId] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const { loading, error, setError, submit } = useFormSubmit();

  const handleSubmit = async () => {
    const tid = teamId.trim();
    if (!tid) return;
    if (!tid.endsWith("-team")) {
      setError("teamId must end with -team");
      return;
    }
    const ok = await submit(async () => {
      await onScaffold(tid, overwrite);
      onClose();
    });
    if (ok === null) return;
  };

  return (
    <Modal show onHide={() => !loading && onClose()}>
      <Modal.Header closeButton>
        <Modal.Title>Scaffold team</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          Scaffold <strong>{recipe.name ?? recipe.id}</strong> as a team workspace.
        </p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <Form.Group className="mb-2">
          <Form.Label>Team ID (must end with -team)</Form.Label>
          <Form.Control
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="e.g. my-team-team"
            disabled={loading}
          />
        </Form.Group>
        <Form.Check
          type="checkbox"
          label="Overwrite existing files"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
          disabled={loading}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            loading ||
            !teamId.trim() ||
            !teamId.trim().endsWith("-team")
          }
        >
          {loading ? "Scaffolding…" : "Scaffold"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
