import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App.jsx';

describe('App scaffold', () => {
  it('renders the app heading inside a router', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: /lab 4/i })).toBeInTheDocument();
  });
});
