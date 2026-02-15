import { useEffect, useState } from "react";
import { Modal, Button as BsButton, Spinner } from "react-bootstrap";
import { fetchCleanupPlan, executeCleanup } from "../api";

type Props = {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
};

export function CleanupModal({ show, onHide, onSuccess }: Props) {
  const [plan, setPlan] = useState<{
    ok: boolean;
    dryRun: boolean;
    rootDir: string;
    candidates: Array<{ teamId: string; absPath: string }>;
    skipped: Array<{ teamId?: string; dirName: string; reason: string }>;
  } | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<{
    deleted: string[];
    deleteErrors?: Array<{ path: string; error: string }>;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!show) return;
    setPlan(null);
    setPlanError(null);
    setExecuteResult(null);
    setConfirming(false);
    setPlanLoading(true);
    fetchCleanupPlan()
      .then((data) => {
        setPlan(data);
        setPlanError(null);
      })
      .catch((e) => {
        setPlanError(String(e));
        setPlan(null);
      })
      .finally(() => setPlanLoading(false));
  }, [show]);

  const handleExecute = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setExecuting(true);
    setExecuteResult(null);
    executeCleanup()
      .then((result) => {
        setExecuteResult({
          deleted: result.deleted ?? [],
          deleteErrors: result.deleteErrors,
        });
        setPlan((prev) =>
          prev ? { ...prev, candidates: [] } : null
        );
        onSuccess?.();
      })
      .catch((e) => {
        setPlanError(String(e));
      })
      .finally(() => {
        setExecuting(false);
        setConfirming(false);
      });
  };

  const handleCancelConfirm = () => setConfirming(false);

  const candidates = plan?.candidates ?? [];
  const hasCandidates = candidates.length > 0;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Cleanup workspaces</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Remove temporary test/scaffold team workspaces (smoke-, qa-, tmp-, test- prefix).
          Protected teams (e.g. development-team) are never deleted.
        </p>
        {planLoading && (
          <div className="text-center py-3 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading...
          </div>
        )}
        {planError && (
          <div className="alert alert-danger" role="alert">{planError}</div>
        )}
        {plan && !planLoading && (
          <>
            {hasCandidates ? (
              <>
                <p className="mb-2">
                  <strong>{candidates.length}</strong> workspace(s) eligible for deletion:
                </p>
                <ul className="small mb-0" style={{ maxHeight: "200px", overflow: "auto" }}>
                  {candidates.map((c) => (
                    <li key={c.teamId}>
                      {c.teamId} — <code className="small">{c.absPath}</code>
                    </li>
                  ))}
                </ul>
                {confirming && (
                  <div className="alert alert-warning mt-3 mb-0 d-flex align-items-start gap-2" role="alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 mt-1" aria-hidden>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <div>
                      <p className="mb-2">Delete the listed workspaces? This cannot be undone.</p>
                    <div className="d-flex gap-2">
                      <BsButton variant="secondary" size="sm" onClick={handleCancelConfirm} disabled={executing}>
                        Cancel
                      </BsButton>
                      <BsButton variant="danger" size="sm" onClick={handleExecute} disabled={executing}>
                        {executing ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-1" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, delete"
                        )}
                      </BsButton>
                    </div>
                    </div>
                  </div>
                )}
              </>
            ) : executeResult ? (
              <div className="alert alert-success mb-0" role="alert">
                Deleted {executeResult.deleted.length} workspace(s).
                {executeResult.deleteErrors && executeResult.deleteErrors.length > 0 && (
                  <div className="mt-2 text-danger small">
                    Errors: {executeResult.deleteErrors.map((e) => e.error).join("; ")}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted mb-0">No workspaces eligible for cleanup.</p>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <BsButton variant="secondary" onClick={onHide} disabled={executing}>
          Close
        </BsButton>
        {hasCandidates && !confirming && (
          <BsButton variant="danger" onClick={handleExecute} disabled={executing}>
            Delete
          </BsButton>
        )}
      </Modal.Footer>
    </Modal>
  );
}
