import React from 'react';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { TicketCard } from './TicketCard';

afterEach(() => cleanup());

const mockTicket = {
  stage: 'backlog',
  number: 1,
  id: '0001-setup-ci',
  file: '/path/to/file.md',
  title: 'Set up CI',
  owner: 'dev',
};

describe('TicketCard', () => {
  test('renders ticket title and id', () => {
    render(<TicketCard ticket={mockTicket} />);
    expect(screen.getByText('Set up CI')).toBeInTheDocument();
    expect(screen.getByText('0001-setup-ci')).toBeInTheDocument();
  });

  test('renders owner badge', () => {
    render(<TicketCard ticket={mockTicket} />);
    expect(screen.getByText('dev')).toBeInTheDocument();
  });

  test('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TicketCard ticket={mockTicket} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockTicket);
  });

  test('calls onSelect when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TicketCard ticket={mockTicket} onSelect={onSelect} />);
    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(mockTicket);
  });

  test('calls onSelect when Space is pressed and prevents default', () => {
    const onSelect = vi.fn();
    render(<TicketCard ticket={mockTicket} onSelect={onSelect} />);
    const card = screen.getByRole('button');
    const keyEvent = fireEvent.keyDown(card, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(mockTicket);
    expect(keyEvent).toBe(false);
  });

  test('has no keyboard handler when onSelect is undefined', () => {
    render(<TicketCard ticket={mockTicket} />);
    expect(screen.getByText('Set up CI').closest('[role="button"]')).toBeNull();
    expect(screen.getByText('Set up CI').closest('[tabindex]')).toBeNull();
  });

  test('shows move dropdown when teamId and onMove provided and not demoMode', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <TicketCard
        ticket={mockTicket}
        teamId="my-team"
        onMove={onMove}
      />
    );
    await user.click(screen.getByTitle('Move ticket'));
    expect(screen.getByText('Move to In Progress')).toBeInTheDocument();
    await user.click(screen.getByText('Move to In Progress'));
    expect(onMove).toHaveBeenCalledWith('0001-setup-ci', 'in-progress', false);
  });
});
