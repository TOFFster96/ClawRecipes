import { describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const kitchenRoot = join(testsDir, '..');

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
  listBindings: vi.fn().mockResolvedValue([]),
  addBinding: vi.fn(),
  removeBinding: vi.fn(),
  removeTeam: vi.fn(),
  recipeStatus: vi.fn().mockResolvedValue([]),
  planCleanup: vi.fn().mockResolvedValue({}),
  executeCleanup: vi.fn().mockResolvedValue({}),
  installRecipeSkills: vi.fn().mockResolvedValue({}),
  scaffoldAgent: vi.fn().mockResolvedValue({}),
}));

vi.mock('../server/activity.js', () => ({
  appendEvent: vi.fn(),
  getRecentEvents: vi.fn().mockReturnValue([]),
}));

describe('Server index - CORS', () => {
  test('applies CORS options in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { createApp } = await import('../server/index.js');
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, openclaw: true });
  });
});

describe('Server index - SPA fallback when dist exists', () => {
  test('GET / serves index.html when app dist exists (not 503)', async () => {
    const tempDist = mkdtempSync(join(tmpdir(), 'kitchen-spa-test-'));
    writeFileSync(join(tempDist, 'index.html'), '<!DOCTYPE html><html><body>test</body></html>');

    vi.doMock('node:path', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:path')>();
      return {
        ...actual,
        join: (...args: string[]) => {
          const result = actual.join(...args);
          if (result.includes('app') && result.includes('dist')) {
            if (result.endsWith('index.html')) return actual.join(tempDist, 'index.html');
            return tempDist;
          }
          return result;
        },
      };
    });
    vi.doMock('node:fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:fs')>();
      return { ...actual, existsSync: () => true };
    });
    vi.resetModules();
    const { createApp } = await import('../server/index.js');
    const app = createApp();

    const res = await request(app).get('/');
    expect(res.status).not.toBe(503);
    expect(res.status).toBe(200);
    expect(res.text).toContain('test');

    rmSync(tempDist, { recursive: true });
  });
});

