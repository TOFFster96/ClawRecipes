import { useEffect, useState } from "react";
import {
  Card,
  Container,
  Form,
  Modal,
  Spinner,
  Button as BsButton,
  ListGroup,
} from "react-bootstrap";
import {
  fetchBindings,
  addBindingAPI,
  removeBindingAPI,
  fetchHealth,
  type Binding,
} from "../api";

export function BindingsPage() {
  const [health, setHealth] = useState<{ openclaw: boolean } | null>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAgentId, setAddAgentId] = useState("");
  const [addChannel, setAddChannel] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchHealth()
      .then((h) => {
        setHealth(h);
        if (!h.openclaw) {
          setLoading(false);
          setBindings([]);
          return;
        }
        return fetchBindings();
      })
      .then((data) => {
        if (data) setBindings(data);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!addAgentId.trim() || !addChannel.trim()) return;
    setAddError(null);
    setAddLoading(true);
    try {
      await addBindingAPI(addAgentId.trim(), { channel: addChannel.trim() });
      setAddModalOpen(false);
      setAddAgentId("");
      setAddChannel("");
      load();
    } catch (e) {
      setAddError(String(e));
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (b: Binding) => {
    try {
      await removeBindingAPI(b.match, b.agentId);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  if (!health) {
    return (
      <Container fluid="lg" className="py-4">
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />
          Checking...
        </div>
      </Container>
    );
  }

  if (!health.openclaw) {
    return (
      <Container fluid="lg" className="py-4">
        <div className="py-5 text-center">
          <div className="alert alert-info mx-auto" style={{ maxWidth: "32rem" }}>
            <strong>Connect OpenClaw to manage bindings</strong>
            <p className="mb-0 mt-2 text-muted small">
              Bindings require OpenClaw to be configured.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container fluid="lg" className="py-4">
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading bindings...
        </div>
      </Container>
    );
  }

  return (
    <Container fluid="lg" className="py-4">
      <h2 className="h5 mb-3">Bindings</h2>
      <p className="text-muted small mb-3">
        Route agents to channels (Telegram, Discord, Slack, etc.). Restart gateway for changes to take effect.
      </p>
      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-medium">Current bindings</span>
            <BsButton variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
              Add binding
            </BsButton>
          </div>
          {bindings.length === 0 ? (
            <div className="text-center py-4">
              <svg className="empty-state-icon mb-2 mx-auto d-block" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              <p className="text-muted mb-0">No bindings configured.</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {bindings.map((b, i) => (
                <ListGroup.Item
                  key={i}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>
                    <strong>{b.agentId}</strong> → {b.match.channel}
                    {b.match.accountId && ` (${b.match.accountId})`}
                    {b.match.peer && ` ${b.match.peer.kind}:${b.match.peer.id}`}
                  </span>
                  <BsButton
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemove(b)}
                  >
                    Remove
                  </BsButton>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <Modal show={addModalOpen} onHide={() => !addLoading && setAddModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add binding</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <div className="alert alert-danger" role="alert">{addError}</div>}
          <Form.Group className="mb-2">
            <Form.Label>Agent ID</Form.Label>
            <Form.Control
              type="text"
              value={addAgentId}
              onChange={(e) => setAddAgentId(e.target.value)}
              placeholder="e.g. my-team-dev"
              disabled={addLoading}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Channel</Form.Label>
            <Form.Control
              type="text"
              value={addChannel}
              onChange={(e) => setAddChannel(e.target.value)}
              placeholder="e.g. telegram"
              disabled={addLoading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <BsButton variant="secondary" onClick={() => setAddModalOpen(false)} disabled={addLoading}>
            Cancel
          </BsButton>
          <BsButton
            variant="primary"
            onClick={handleAdd}
            disabled={addLoading || !addAgentId.trim() || !addChannel.trim()}
          >
            {addLoading ? "Adding…" : "Add"}
          </BsButton>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
