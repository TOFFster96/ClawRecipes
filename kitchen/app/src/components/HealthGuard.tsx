import { Container, Button as BsButton } from "react-bootstrap";
import { LoadingSpinner } from "./LoadingSpinner";

type HealthResult = { ok: boolean; openclaw: boolean };
type HealthAsync = {
  data: HealthResult | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

type Props = {
  health: HealthAsync;
  /** Message shown when health data is loading. Default: "Checking..." */
  checkingMessage?: string;
  /** Message when OpenClaw is required but unavailable (not a connection error). Default: "Connect OpenClaw to continue" */
  openclawMessage?: string;
  /** Extra detail for openclaw message (e.g. "Recipes require OpenClaw...") */
  openclawDetail?: string;
  /** Message when connection to server fails. Default: "Unable to connect to Kitchen server" */
  connectionErrorTitle?: string;
  /** Regex to detect connection errors (vs openclaw-unavailable). Default: !/openclaw|unavailable/i */
  connectionErrorPattern?: RegExp;
  children: React.ReactNode;
};

export function HealthGuard({
  health,
  checkingMessage = "Checking...",
  openclawMessage = "Connect OpenClaw to continue",
  openclawDetail,
  connectionErrorTitle = "Unable to connect to Kitchen server",
  connectionErrorPattern = /openclaw|unavailable/i,
  children,
}: Props) {
  if (!health.data) {
    return (
      <Container fluid="lg" className="py-4">
        <LoadingSpinner message={checkingMessage} className="text-center py-5 text-muted" />
      </Container>
    );
  }

  if (!health.data.openclaw) {
    const isConnectionError =
      health.error && !connectionErrorPattern.test(health.error);
    return (
      <Container fluid="lg" className="py-4">
        <div className="py-5 text-center">
          <div className="alert alert-info mx-auto" style={{ maxWidth: "32rem" }}>
            {isConnectionError ? (
              <>
                <strong>{connectionErrorTitle}</strong>
                <p className="mb-0 mt-2 text-muted small">{health.error}</p>
              </>
            ) : (
              <>
                <strong>{openclawMessage}</strong>
                {openclawDetail && (
                  <p className="mb-0 mt-2 text-muted small">{openclawDetail}</p>
                )}
              </>
            )}
            <BsButton
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={health.retry}
            >
              Check again
            </BsButton>
          </div>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
