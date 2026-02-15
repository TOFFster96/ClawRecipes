import { Button, Modal } from "react-bootstrap";
import { IconWarning } from "./icons/IconWarning";

type Props = {
  show: boolean;
  onHide: () => void;
  teamId: string | null;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
};

export function RemoveTeamModal({
  show,
  onHide,
  teamId,
  loading,
  error,
  onConfirm,
}: Props) {
  return (
    <Modal show={show} onHide={() => !loading && onHide()}>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconWarning width={24} height={24} className="text-warning" />
          Delete team
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <p className="mb-0">
          This will delete <strong>workspace-{teamId}</strong>, remove matching
          agents from OpenClaw config, and remove stamped cron jobs. This cannot
          be undone.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting…" : "Delete team"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
