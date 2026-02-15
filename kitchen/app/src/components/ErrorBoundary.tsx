import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Kitchen] ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5">
          <div className="card mx-auto error-boundary-card border-warning">
            <div className="card-body text-center py-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-warning mb-3" aria-hidden>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <h5 className="card-title">Something went wrong</h5>
              <p className="text-muted small mb-3">An unexpected error occurred. You can try again or reload the page.</p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => this.setState({ hasError: false })}
                >
                  Try again
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
