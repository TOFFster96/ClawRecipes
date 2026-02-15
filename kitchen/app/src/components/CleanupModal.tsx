import { useEffect, useState } from "react";
import { Modal, Button as BsButton, Spinner } from "react-bootstrap";
import { fetchCleanupPlan, executeCleanup } from "../api";
import { useAsync } from "../hooks/useAsync";
import { LoadingSpinner } from "./LoadingSpinner";
import { IconWarning } from "./icons/IconWarning";

type Props = {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
};

export function CleanupModal({ show, onHide, onSuccess }: Props) {
  const [planOverride, setPlanOverride] = useState<{
    ok: boolean;
    dryRun: boolean;
    rootDir: string;
    candidates: Array<{ teamId: string; absPath: string }>;
    skipped: Array<{ teamId?: string; dirName: string; reason: string }>;
  } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<{
    deleted: string[];
    deleteErrors?: Array<{ path: string; error: string }>;
  } | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const planData = useAsync(() => fetchCleanupPlan(), [], { enabled: show });
  const plan = planData.data;
  const planLoading = planData.loading;
  const planError = planData.error;

  useEffect(() => {
    if (show) {
      setPlanOverride(null);
      setExecuteResult(null);
      setExecuteError(null);
      setConfirming(false);
    }
  }, [show]);

  const handleExecute = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setExecuting(true);
    setExecuteResult(null);
    setExecuteError(null);
    executeCleanup()
      .then((result) => {
        setExecuteResult({
          deleted: result.deleted ?? [],
          deleteErrors: result.deleteErrors,
        });
        setPlanOverride(plan ? { ...plan, candidates: [] } : null);
        onSuccess?.();
      })
      .catch((e) => {
        setExecuteError(String(e));
      })
      .finally(() => {
        setExecuting(false);
        setConfirming(false);
      });
  };

  const handleCancelConfirm = () => setConfirming(false);

  const displayPlan = planOverride ?? plan;
  const candidates = displayPlan?.candidates ?? [];
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
          <LoadingSpinner message="Loading..." className="text-center py-3 text-muted" />
        )}
        {(planError || executeError) && (
          <div className="alert alert-danger" role="alert">{executeError ?? planError}</div>
        )}
        {displayPlan && !planLoading && (
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
                    <IconWarning width={20} height={20} className="flex-shrink-0 mt-1" />
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
