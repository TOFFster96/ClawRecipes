import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchTeams,
  fetchTickets,
  moveTicket,
  removeTeam,
  DEMO_TEAMS,
  DEMO_TEAM_ID,
  type Team,
  type TicketsResponse,
} from "../api";
import { Container, Nav } from "react-bootstrap";
import { TeamPicker } from "../components/TeamPicker";
import { KanbanBoard } from "../components/KanbanBoard";
import { ActivityFeed } from "../components/ActivityFeed";
import { CleanupModal } from "../components/CleanupModal";
import { TicketDetail } from "../components/TicketDetail";
import { DispatchModal } from "../components/DispatchModal";
import { InboxList } from "../components/InboxList";
import { RemoveTeamModal } from "../components/RemoveTeamModal";
import { useDemo } from "../DemoContext";
import { useAsync } from "../hooks/useAsync";
import type { Ticket } from "../api";

const REFRESH_INTERVAL_MS = 30000;

export function BoardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { demoMode, setDemoMode } = useDemo();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [boardTab, setBoardTab] = useState<"board" | "inbox">("board");
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMoveError, setTicketMoveError] = useState<string | null>(null);
  const [removeConfirmTeamId, setRemoveConfirmTeamId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [ticketsDataVersion, setTicketsDataVersion] = useState(0);

  const prevDemoMode = useRef(demoMode);
  const teamFromUrl = searchParams.get("team");

  const teamsData = useAsync(
    () => fetchTeams(),
    [demoMode, refreshTrigger],
    { enabled: !demoMode }
  );
  const teams = teamsData.data ?? [];
  const teamsLoading = teamsData.loading;
  const teamsError = teamsData.error;

  const ticketsData = useAsync<TicketsResponse>(
    () => (selectedTeamId ? fetchTickets(selectedTeamId) : Promise.resolve(null) as Promise<TicketsResponse | null>),
    [selectedTeamId, demoMode, refreshTrigger],
    { enabled: !!selectedTeamId, refetchInterval: REFRESH_INTERVAL_MS }
  );

  useEffect(() => {
    if (ticketsData.data) setTicketsDataVersion((v) => v + 1);
  }, [ticketsData.data]);

  // When URL has ?team=demo-team, enter demo mode so demo data loads consistently (e.g. after refresh).
  useEffect(() => {
    if (teamFromUrl !== DEMO_TEAM_ID) return;
    if (demoMode) return;
    setDemoMode(true);
  }, [teamFromUrl, demoMode, setDemoMode]);

  useEffect(() => {
    if (!teamFromUrl) return;
    setSelectedTeamId((prev) => (prev !== teamFromUrl ? teamFromUrl : prev));
  }, [teamFromUrl]);

  useEffect(() => {
    if (prevDemoMode.current && !demoMode) {
      setSelectedTeamId(null);
      setSearchParams({}, { replace: true });
      setSelectedTicket(null);
      setRefreshTrigger((n) => n + 1);
    }
    prevDemoMode.current = demoMode;
  }, [demoMode, setSearchParams]);

  const handleRefresh = () => {
    if (demoMode) return;
    setRefreshTrigger((n) => n + 1);
  };

  const handleTicketMove = async (
    ticketId: string,
    to: string,
    completed?: boolean
  ) => {
    if (!selectedTeamId || demoMode || selectedTeamId === DEMO_TEAM_ID) return;
    setTicketMoveError(null);
    try {
      await moveTicket(selectedTeamId, ticketId, to, completed);
      ticketsData.retry();
    } catch (e) {
      setTicketMoveError(String(e));
    }
  };

  const handleTicketUpdated = () => {
    if (demoMode) return;
    ticketsData.retry();
  };

  const handleUseDemo = () => {
    setDemoMode(true);
    setSelectedTeamId(DEMO_TEAM_ID);
    setSearchParams({ team: DEMO_TEAM_ID }, { replace: true });
    setSelectedTicket(null);
  };

  const displayTeams = demoMode ? DEMO_TEAMS : teams;

  const handleSelectTeam = (teamId: string | null) => {
    setSelectedTeamId(teamId);
    setSearchParams(teamId ? { team: teamId } : {}, { replace: true });
  };

  const handleRemoveTeam = (teamId: string) => {
    setRemoveConfirmTeamId(teamId);
    setRemoveError(null);
  };

  const handleConfirmRemove = async () => {
    if (!removeConfirmTeamId) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await removeTeam(removeConfirmTeamId);
      setRemoveConfirmTeamId(null);
      if (selectedTeamId === removeConfirmTeamId) {
        setSelectedTeamId(null);
        setSearchParams({}, { replace: true });
        setSelectedTicket(null);
      }
      setRefreshTrigger((n) => n + 1);
      teamsData.retry();
    } catch (e) {
      setRemoveError(String(e));
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="board-page-layout d-flex">
      <div className="board-main flex-grow-1 min-w-0 overflow-auto">
        <Container fluid="lg" className="py-4">
          <TeamPicker
        teams={displayTeams}
        selectedTeamId={selectedTeamId}
        onSelect={handleSelectTeam}
        onUseDemo={(teams.length === 0 && !teamsLoading) || teamsError ? handleUseDemo : undefined}
        onRefresh={!demoMode && teams.length > 0 ? handleRefresh : undefined}
        onRemoveTeam={!demoMode ? handleRemoveTeam : undefined}
        loading={teamsLoading}
        error={teamsError}
      />
          {!demoMode && (
            <div className="mb-3">
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-muted"
                onClick={() => setCleanupModalOpen(true)}
              >
                Cleanup workspaces
              </button>
            </div>
          )}

      <CleanupModal
        show={cleanupModalOpen}
        onHide={() => setCleanupModalOpen(false)}
        onSuccess={() => setRefreshTrigger((n) => n + 1)}
      />

      <RemoveTeamModal
        show={!!removeConfirmTeamId}
        onHide={() => setRemoveConfirmTeamId(null)}
        teamId={removeConfirmTeamId}
        loading={removeLoading}
        error={removeError}
        onConfirm={handleConfirmRemove}
      />

      {selectedTeamId && (
        <>
          {demoMode && (
            <div className="alert alert-info py-2 mb-2" role="status">
              Actions disabled in demo mode.
            </div>
          )}
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link
                id="board-tab"
                active={boardTab === "board"}
                onClick={() => setBoardTab("board")}
              >
                Board
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                id="inbox-tab"
                active={boardTab === "inbox"}
                onClick={() => setBoardTab("inbox")}
              >
                Inbox
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {boardTab === "board" && (
            <div role="tabpanel" id="board-panel" aria-labelledby="board-tab">
              {ticketMoveError && (
                <div className="alert alert-danger alert-dismissible py-2 mb-2" role="alert">
                  {ticketMoveError}
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setTicketMoveError(null)}
                  />
                </div>
              )}
              <div className="d-flex justify-content-end mb-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setDispatchModalOpen(true)}
                  disabled={demoMode || selectedTeamId === DEMO_TEAM_ID}
                >
                  New ticket
                </button>
              </div>
              <KanbanBoard
            backlog={ticketsData.data?.backlog ?? []}
            inProgress={ticketsData.data?.inProgress ?? []}
            testing={ticketsData.data?.testing ?? []}
            done={ticketsData.data?.done ?? []}
            loading={ticketsData.loading}
            error={ticketsData.error}
            onSelectTicket={setSelectedTicket}
            dataVersion={ticketsDataVersion}
            teamId={selectedTeamId}
            demoMode={demoMode}
            onTicketMove={handleTicketMove}
              />

              {selectedTicket && (
            <TicketDetail
              ticket={selectedTicket}
              teamId={selectedTeamId}
              onClose={() => setSelectedTicket(null)}
              demoMode={demoMode}
              onUpdated={handleTicketUpdated}
              />
              )}
              <DispatchModal
            teamId={selectedTeamId}
            show={dispatchModalOpen}
            onClose={() => setDispatchModalOpen(false)}
            onSuccess={handleTicketUpdated}
              disabled={demoMode || selectedTeamId === DEMO_TEAM_ID}
              />
            </div>
          )}

          {boardTab === "inbox" && (
            <div role="tabpanel" id="inbox-panel" aria-labelledby="inbox-tab">
              <InboxList teamId={selectedTeamId} />
            </div>
          )}
        </>
      )}
        </Container>
      </div>
      <ActivityFeed />
    </div>
  );
}
