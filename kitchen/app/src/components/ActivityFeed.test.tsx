import React from 'react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityFeed } from './ActivityFeed';

vi.mock('../api', () => ({
  fetchActivity: vi.fn(),
}));

import { fetchActivity } from '../api';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.mocked(fetchActivity).mockResolvedValue([]);
  });

  test('formats relative time: "just now" for recent events', async () => {
    const now = new Date();
    vi.mocked(fetchActivity).mockResolvedValue([
      { id: '1', type: 'move', message: 'Recent', timestamp: new Date(now.getTime() - 5000).toISOString() },
    ]);
    render(<ActivityFeed />);
    expect(await screen.findByText('just now')).toBeInTheDocument();
  });

  test('formats relative time: "Xm ago" for events within an hour', async () => {
    const now = new Date();
    vi.mocked(fetchActivity).mockResolvedValue([
      { id: '1', type: 'move', message: '5 min ago', timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString() },
    ]);
    render(<ActivityFeed />);
    expect(await screen.findByText('5m ago')).toBeInTheDocument();
  });

  test('formats relative time: "Xh ago" for events within a day', async () => {
    const now = new Date();
    vi.mocked(fetchActivity).mockResolvedValue([
      { id: '1', type: 'move', message: 'Moved ticket', timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString() },
    ]);
    render(<ActivityFeed />);
    await screen.findByText('Moved ticket');
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  test('formats relative time: locale date for events older than a day', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 25 * 3600 * 1000);
    vi.mocked(fetchActivity).mockResolvedValue([
      { id: '1', type: 'move', message: 'Yesterday', timestamp: yesterday.toISOString() },
    ]);
    render(<ActivityFeed />);
    const expected = yesterday.toLocaleDateString();
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  test('renders Activity header when expanded', async () => {
    render(<ActivityFeed />);
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  test('shows No activity yet when empty', async () => {
    render(<ActivityFeed />);
    const els = await screen.findAllByText('No activity yet');
    expect(els.length).toBeGreaterThanOrEqual(1);
    expect(els[0]).toBeInTheDocument();
  });

  test('shows error when fetchActivity fails', async () => {
    vi.mocked(fetchActivity).mockRejectedValue(new Error('Network error'));
    render(<ActivityFeed />);
    expect(await screen.findByText(/Network error/)).toBeInTheDocument();
  });

  test('shows events when fetchActivity returns data', async () => {
    vi.mocked(fetchActivity).mockResolvedValue([
      { id: '1', type: 'move', message: 'Moved ticket 0001 to in-progress', timestamp: new Date().toISOString() },
    ]);

    render(<ActivityFeed />);
    expect(await screen.findByText('Moved ticket 0001 to in-progress')).toBeInTheDocument();
  });

  test('collapse/expand toggle has aria-label', () => {
    render(<ActivityFeed />);
    const toggles = screen.getAllByRole('button', { name: /collapse activity feed/i });
    expect(toggles.length).toBeGreaterThanOrEqual(1);
    expect(toggles[0]).toBeInTheDocument();
  });

  test('clicking toggle when expanded collapses the feed', async () => {
    const user = userEvent.setup();
    render(<ActivityFeed />);
    const toggle = screen.getByRole('button', { name: /collapse activity feed/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('when collapsed, Activity title is not visible', async () => {
    const user = userEvent.setup();
    render(<ActivityFeed />);
    const toggle = screen.getByRole('button', { name: /collapse activity feed/i });
    await user.click(toggle);
    expect(screen.queryByText('Activity')).not.toBeInTheDocument();
  });
});
