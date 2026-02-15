import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

const mockCreateRoot = vi.hoisted(() => vi.fn(() => ({ render: vi.fn() })));

vi.mock('react-dom/client', () => ({
  default: { createRoot: mockCreateRoot },
  createRoot: mockCreateRoot,
}));

vi.mock('./App', () => ({ default: () => null }));
vi.mock('./ThemeContext', () => ({ ThemeProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('./components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: { children: React.ReactNode }) => children }));

describe('main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const root = document.createElement('div');
    root.id = 'root';
    document.body.innerHTML = '';
    document.body.appendChild(root);
  });

  test('creates root and renders App', async () => {
    await import('./main');
    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'));
    const renderFn = mockCreateRoot.mock.results[0]?.value?.render;
    expect(renderFn).toBeDefined();
    expect(renderFn).toHaveBeenCalled();
  });
});
