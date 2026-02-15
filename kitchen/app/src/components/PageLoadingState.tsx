import { Container } from "react-bootstrap";
import { LoadingSpinner } from "./LoadingSpinner";

type Props = {
  loading: boolean;
  error?: string | null;
  loadingMessage: string;
  children: React.ReactNode;
};

export function PageLoadingState({
  loading,
  error,
  loadingMessage,
  children,
}: Props) {
  if (loading) {
    return (
      <Container fluid="lg" className="py-4">
        <LoadingSpinner message={loadingMessage} className="text-center py-5 text-muted" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid="lg" className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
