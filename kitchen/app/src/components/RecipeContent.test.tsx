import React from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeContent } from './RecipeContent';

describe('RecipeContent', () => {
  test('renders body when markdown has no frontmatter', () => {
    const { container } = render(<RecipeContent md="# Title\n\nBody text" />);
    expect(screen.getByRole('heading', { name: /Title/ })).toBeInTheDocument();
    expect(container.querySelector('.recipe-detail-markdown')).toBeInTheDocument();
    expect(container.querySelector('.recipe-frontmatter')).toBeNull();
  });

  test('parses frontmatter and renders both body and frontmatter', () => {
    const md = `---
key: value
foo: bar
---

# Recipe

Body content here.`;
    const { container } = render(<RecipeContent md={md} />);
    expect(screen.getByText('Recipe')).toBeInTheDocument();
    expect(screen.getByText('Body content here.')).toBeInTheDocument();
    const pre = container.querySelector('.recipe-frontmatter');
    expect(pre).toHaveTextContent('key: value');
    expect(pre).toHaveTextContent('foo: bar');
  });

  test('handles frontmatter with body starting after second ---', () => {
    const md = `---
meta: data
---

# Section

Content after frontmatter.`;
    const { container } = render(<RecipeContent md={md} />);
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Content after frontmatter.')).toBeInTheDocument();
    expect(container.querySelector('.recipe-frontmatter')).toHaveTextContent('meta: data');
  });

  test('renders only frontmatter when body is empty after frontmatter', () => {
    const md = `---
only: frontmatter
---
`;
    const { container } = render(<RecipeContent md={md} />);
    const pre = container.querySelector('.recipe-frontmatter');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent('only: frontmatter');
    expect(container.querySelector('.recipe-detail-markdown')).toBeNull();
  });
});
