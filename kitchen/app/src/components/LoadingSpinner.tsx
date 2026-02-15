import { Spinner } from "react-bootstrap";

type Props = {
  message?: string;
  className?: string;
  size?: "sm" | undefined;
};

export function LoadingSpinner({ message = "Loading...", className = "text-center py-4 text-muted", size = "sm" }: Props) {
  return (
    <div className={className}>
      <Spinner animation="border" size={size} className="me-2" aria-hidden />
      {message}
    </div>
  );
}
