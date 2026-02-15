import React from 'react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CleanupModal } from './CleanupModal';

vi.mock('../api', () => ({
  fetchCleanupPlan: vi.fn(),
  executeCleanup: vi.fn(),
}));

import { fetchCleanupPlan, executeCleanup } from '../api';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CleanupModal', () => {
  beforeEach(() => {
    vi.mocked(fetchCleanupPlan).mockResolvedValue({
      ok: true,
      dryRun: true,
      rootDir: '/tmp',
      candidates: [{ teamId: 'smoke-001-team', absPath: '/tmp/workspace-smoke-001-team' }],
      skipped: [],
    });
  });

  test('renders when show is true', async () => {
    render(<CleanupModal show={true} onHide={() => {}} />);
    expect(screen.getByText('Cleanup workspaces')).toBeInTheDocument();
    expect(await screen.findByText(/workspace\(s\) eligible for deletion/)).toBeInTheDocument();
  });

  test('does not fetch plan when show is false', () => {
    render(<CleanupModal show={false} onHide={() => {}} />);
    expect(fetchCleanupPlan).not.toHaveBeenCalled();
  });

  test('fetches plan on open', async () => {
    render(<CleanupModal show={true} onHide={() => {}} />);
    await waitFor(() => {
      expect(fetchCleanupPlan).toHaveBeenCalled();
    });
  });

  test('shows Close button', async () => {
    render(<CleanupModal show={true} onHide={() => {}} />);
    const dialog = await screen.findByRole('dialog');
    const closeBtns = within(dialog).getAllByRole('button', { name: 'Close' });
    expect(closeBtns.length).toBeGreaterThanOrEqual(1);
  });

  test('shows Delete button when candidates exist', async () => {
    render(<CleanupModal show={true} onHide={() => {}} />);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  test('calls onHide when Close clicked', async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    render(<CleanupModal show={true} onHide={onHide} />);
    const dialog = await screen.findByRole('dialog');
    const closeBtns = within(dialog).getAllByRole('button', { name: 'Close' });
    await user.click(closeBtns[0]);
    expect(onHide).toHaveBeenCalled();
  });

  test('shows No workspaces eligible when plan has no candidates', async () => {
    vi.mocked(fetchCleanupPlan).mockResolvedValue({
      ok: true,
      dryRun: true,
      rootDir: '/tmp',
      candidates: [],
      skipped: [],
    });

    render(<CleanupModal show={true} onHide={() => {}} />);
    expect(await screen.findByText(/No workspaces eligible for cleanup/)).toBeInTheDocument();
  });

  test('shows error when fetchCleanupPlan fails', async () => {
    vi.mocked(fetchCleanupPlan).mockRejectedValue(new Error('Workspace not configured'));

    render(<CleanupModal show={true} onHide={() => {}} />);
    expect(await screen.findByText(/Workspace not configured/)).toBeInTheDocument();
  });

  test('Delete then Cancel does not call executeCleanup', async () => {
    const user = userEvent.setup();
    render(<CleanupModal show={true} onHide={() => {}} />);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(executeCleanup).not.toHaveBeenCalled();
  });

  test('Delete then Yes, delete calls executeCleanup and shows success', async () => {
    vi.mocked(executeCleanup).mockResolvedValue({
      ok: true,
      dryRun: false,
      rootDir: '/tmp',
      candidates: [],
      skipped: [],
      deleted: ['/tmp/workspace-smoke-001-team'],
    });
    const user = userEvent.setup();
    render(<CleanupModal show={true} onHide={() => {}} />);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await user.click(within(dialog).getByRole('button', { name: /Yes, delete/ }));
    await waitFor(() => {
      expect(executeCleanup).toHaveBeenCalled();
    });
    expect(await screen.findByText(/Deleted 1 workspace\(s\)\./)).toBeInTheDocument();
  });

  test('Delete shows error when executeCleanup fails', async () => {
    vi.mocked(executeCleanup).mockRejectedValue(new Error('Delete failed'));
    const user = userEvent.setup();
    render(<CleanupModal show={true} onHide={() => {}} />);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await user.click(within(dialog).getByRole('button', { name: /Yes, delete/ }));
    expect(await screen.findByText(/Delete failed/)).toBeInTheDocument();
  });

  test('Delete success calls onSuccess', async () => {
    const onSuccess = vi.fn();
    vi.mocked(executeCleanup).mockResolvedValue({
      ok: true,
      dryRun: false,
      rootDir: '/tmp',
      candidates: [],
      skipped: [],
      deleted: ['/tmp/workspace-smoke-001-team'],
    });
    const user = userEvent.setup();
    render(<CleanupModal show={true} onHide={() => {}} onSuccess={onSuccess} />);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await user.click(within(dialog).getByRole('button', { name: /Yes, delete/ }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  test('Delete shows deleteErrors when present', async () => {
    vi.mocked(executeCleanup).mockResolvedValue({
      ok: false,
      dryRun: false,
      rootDir: '/tmp',
      candidates: [],
      skipped: [],
      deleted: ['/tmp/deleted-one'],
      deleteErrors: [{ path: '/tmp/failed', error: 'Permission denied' }],
    });
    const user = userEvent.setup();
    render(<CleanupModal show={true} onHide={() => {}} />);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await user.click(within(dialog).getByRole('button', { name: /Yes, delete/ }));
    expect(await screen.findByText(/Permission denied/)).toBeInTheDocument();
  });
});
