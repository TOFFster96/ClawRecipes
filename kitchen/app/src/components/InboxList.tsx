import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import { Button, ListGroup, Modal } from "react-bootstrap";
import { fetchInbox, fetchInboxContent, type InboxItem } from "../api";
import { useAsync } from "../hooks/useAsync";
import { LoadingSpinner } from "./LoadingSpinner";

type Props = {
  teamId: string;
};

export function InboxList({ teamId }: Props) {
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const inboxData = useAsync(() => fetchInbox(teamId), [teamId]);
  const items = inboxData.data ?? [];
  const loading = inboxData.loading;
  const error = inboxData.error;

  const contentData = useAsync(
    () => (selectedItem ? fetchInboxContent(teamId, selectedItem.id) : Promise.resolve(null) as Promise<string | null>),
    [teamId, selectedItem?.id],
    { enabled: !!selectedItem }
  );
  const content = contentData.data;
  const contentLoading = contentData.loading;
  const contentError = contentData.error;

  if (loading) {
    return <LoadingSpinner message="Loading inbox..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <p className="mb-2">{error}</p>
        <Button variant="primary" size="sm" onClick={() => inboxData.retry()}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <svg className="empty-state-icon mb-2 mx-auto d-block" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
        <p className="mb-0">No inbox items yet</p>
      </div>
    );
  }

  return (
    <>
      <ListGroup>
        {items.map((item) => (
          <ListGroup.Item
            key={item.id}
            action
            active={selectedItem?.id === item.id}
            onClick={() => setSelectedItem(item)}
            className="d-flex justify-content-between align-items-start"
          >
            <div>
              <div className="fw-medium">{item.title ?? item.id}</div>
              {item.received && (
                <small className="text-muted">{item.received}</small>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Modal
        show={!!selectedItem}
        onHide={() => setSelectedItem(null)}
        size="lg"
        scrollable
      >
        {selectedItem && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedItem.title ?? selectedItem.id}</Modal.Title>
              {selectedItem.received && (
                <span className="text-muted small ms-2">{selectedItem.received}</span>
              )}
            </Modal.Header>
            <Modal.Body>
              {contentLoading && <LoadingSpinner message="Loading..." />}
              {contentError && !contentLoading && (
                <div className="alert alert-danger" role="alert">
                  <p className="mb-2">{contentError}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => contentData.retry()}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {content && !contentLoading && !contentError && (
                <div className="inbox-detail-markdown">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>
    </>
  );
}
