import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App.jsx';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App – lazy PersonDetail route', () => {
  it('shows the skeleton fallback first, then the lazily loaded detail', async () => {
    const { container } = renderAt('/people/2');
    const main = screen.getByRole('main');
    expect(main.querySelector('[aria-busy="true"][aria-live="polite"]')).not.toBeNull();

    expect(await screen.findByText('Cryptographer')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows the 404 alert inside the layout for an unknown id', async () => {
    renderAt('/people/999');
    expect(await screen.findByRole('alert')).toHaveTextContent('404: Person Not Found');
    expect(screen.getByRole('navigation', { name: /people/i })).toBeInTheDocument();
  });
});
