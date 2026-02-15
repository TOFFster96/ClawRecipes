import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import type { Recipe } from "../api";
import { useFormSubmit } from "../hooks/useFormSubmit";

type ScaffoldAgentModalProps = {
  recipe: Recipe;
  onScaffold: (
    agentId: string,
    options?: { name?: string; overwrite?: boolean }
  ) => Promise<void>;
  onClose: () => void;
};

export function ScaffoldAgentModal({ recipe, onScaffold, onClose }: ScaffoldAgentModalProps) {
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const { loading, error, submit } = useFormSubmit();

  const handleSubmit = async () => {
    const aid = agentId.trim();
    if (!aid) return;
    const ok = await submit(async () => {
      await onScaffold(aid, {
        name: name.trim() || undefined,
        overwrite,
      });
      onClose();
    });
    if (ok === null) return;
  };

  return (
    <Modal show onHide={() => !loading && onClose()}>
      <Modal.Header closeButton>
        <Modal.Title>Scaffold agent</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          Scaffold <strong>{recipe.name ?? recipe.id}</strong> as a standalone agent workspace.
        </p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <Form.Group className="mb-2">
          <Form.Label>Agent ID</Form.Label>
          <Form.Control
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="e.g. pm"
            disabled={loading}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Name (optional)</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Project Manager"
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
          disabled={loading || !agentId.trim()}
        >
          {loading ? "Scaffolding…" : "Scaffold"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
