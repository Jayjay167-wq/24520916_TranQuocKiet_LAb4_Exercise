import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App.jsx';
import { people } from './data/people.js';

describe('App routing', () => {
  it('mounts PeopleLayout at /people with a link for every person', () => {
    render(
      <MemoryRouter initialEntries={['/people']}>
        <App />
      </MemoryRouter>
    );
    const nav = screen.getByRole('navigation', { name: /people/i });
    for (const p of people) {
      expect(screen.getByRole('link', { name: p.name })).toHaveAttribute('href', `/people/${p.id}`);
    }
    expect(nav).toBeInTheDocument();
  });
});
