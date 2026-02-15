import React from 'react';
import { describe, expect, test, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../ThemeContext';
import { DemoProvider } from '../DemoContext';
import { Layout } from './Layout';

function renderLayout(initialEntries: string[]) {
  return render(
    <ThemeProvider>
      <DemoProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="board" element={<div>Board</div>} />
              <Route path="recipes" element={<div>Recipes</div>} />
              <Route path="bindings" element={<div>Bindings</div>} />
              <Route path="*" element={<div>Other</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </DemoProvider>
    </ThemeProvider>
  );
}

describe('Layout', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  test('sets document.title to Board when at /board', () => {
    renderLayout(['/board']);
    expect(document.title).toBe('Board – ClawRecipes Kitchen');
  });

  test('sets document.title to Recipes when at /recipes', () => {
    renderLayout(['/recipes']);
    expect(document.title).toBe('Recipes – ClawRecipes Kitchen');
  });

  test('sets document.title to Bindings when at /bindings', () => {
    renderLayout(['/bindings']);
    expect(document.title).toBe('Bindings – ClawRecipes Kitchen');
  });

  test('sets document.title to base when at other path', () => {
    renderLayout(['/other']);
    expect(document.title).toBe('ClawRecipes Kitchen');
  });
});
