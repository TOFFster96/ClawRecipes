import { describe, expect, test, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { existsSync } from 'node:fs';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
}));

vi.mock('../server/openclaw.js', () => ({
  checkOpenClaw: vi.fn().mockResolvedValue(true),
  listTeams: vi.fn().mockResolvedValue([]),
  getTickets: vi.fn().mockResolvedValue({}),
  getTicketContent: vi.fn().mockResolvedValue(null),
  listInbox: vi.fn().mockResolvedValue([]),
  getInboxItemContent: vi.fn().mockResolvedValue(null),
  listRecipes: vi.fn().mockResolvedValue([]),
  showRecipe: vi.fn().mockResolvedValue(''),
  scaffoldTeam: vi.fn(),
  moveTicket: vi.fn(),
  assignTicket: vi.fn(),
  takeTicket: vi.fn(),
  handoffTicket: vi.fn(),
  completeTicket: vi.fn(),
  dispatch: vi.fn(),
}));

const { createApp } = await import('../server/index.js');
const app = createApp();

describe('Static / SPA fallback when dist missing', () => {
  test('GET / returns 503 when app dist does not exist', async () => {
    const res = await request(app).get('/').expect(503);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('not built');
    expect(res.text).toContain('npm run build');
  });
});

describe('Static / SPA fallback when dist exists', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReturnValue(true);
  });

  test('GET / returns 200 and HTML when dist exists', async () => {
    const appWithDist = createApp();
    const res = await request(appWithDist).get('/').expect(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/<!DOCTYPE html|<\/html>/i);
  });

  test('GET /board returns index.html (SPA fallback)', async () => {
    const appWithDist = createApp();
    const res = await request(appWithDist).get('/board').expect(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/<!DOCTYPE html|<\/html>/i);
  });
});
