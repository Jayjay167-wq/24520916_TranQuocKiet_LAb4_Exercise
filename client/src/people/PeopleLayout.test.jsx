import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PeopleLayout from './PeopleLayout.jsx';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vitest skips CSS processing (css: false), so a '?raw' import comes back empty, and under jsdom
// import.meta.url is not a file: URL — read the stylesheet from the client root instead.
const layoutCss = readFileSync(resolve(process.cwd(), 'src/people/PeopleLayout.css'), 'utf8');

const people = [
  { id: '1', name: 'Ada Lovelace', role: 'Analyst' },
  { id: '2', name: 'Alan Turing', role: 'Cryptographer' },
  { id: '3', name: 'Grace Hopper', role: 'Admiral' },
];

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/people" element={<PeopleLayout people={people} />}>
          <Route index element={<p>index child</p>} />
          <Route path=":id" element={<p>child outlet content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PeopleLayout', () => {
  it('renders one NavLink per person pointing at /people/:id', () => {
    renderAt('/people');
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(people.length);
    people.forEach((p, i) => {
      expect(links[i]).toHaveTextContent(p.name);
      expect(links[i]).toHaveAttribute('href', `/people/${p.id}`);
    });
  });

  it('marks only the current person link as active-link', () => {
    renderAt('/people/2');
    const active = screen.getByRole('link', { name: 'Alan Turing' });
    expect(active).toHaveClass('active-link');
    expect(active).not.toHaveClass('link');
    expect(active).toHaveAttribute('aria-current', 'page');

    for (const name of ['Ada Lovelace', 'Grace Hopper']) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveClass('link');
      expect(link).not.toHaveClass('active-link');
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('renders the matched child route inside main.content-area via Outlet', () => {
    const { container } = renderAt('/people/3');
    const main = screen.getByRole('main');
    expect(main).toHaveClass('content-area');
    expect(within(main).getByText('child outlet content')).toBeInTheDocument();
    expect(container.querySelector('.people-frame > nav.sidebar')).not.toBeNull();
    expect(container.querySelector('.people-frame > main.content-area')).not.toBeNull();
  });

  it('lays out the frame with CSS Grid minmax(280px, 1fr) 2fr', () => {
    const rule = layoutCss.match(/\.people-frame\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/display:\s*grid/);
    expect(rule).toMatch(/grid-template-columns:\s*minmax\(280px,\s*1fr\)\s+2fr/);
  });
});
