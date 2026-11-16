import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PersonDetail from './PersonDetail.jsx';

const people = [
  { id: '1', name: 'Ada Lovelace', role: 'Analyst' },
  { id: '2', name: 'Alan Turing', role: 'Cryptographer' },
];

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/people/:id" element={<PersonDetail people={people} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PersonDetail', () => {
  it('reads :id from the URL and renders the person as a <dl>', () => {
    const { container } = renderAt('/people/2');
    const dl = container.querySelector('dl.person-details');
    expect(dl).not.toBeNull();

    const terms = within(dl).getAllByRole('term').map((el) => el.textContent);
    const defs = within(dl).getAllByRole('definition').map((el) => el.textContent);
    expect(terms).toEqual(['Name', 'Role']);
    expect(defs).toEqual(['Alan Turing', 'Cryptographer']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders a 404 alert and no <dl> when the id does not exist', () => {
    const { container } = renderAt('/people/999');
    expect(screen.getByRole('alert')).toHaveTextContent('404: Person Not Found');
    expect(container.querySelector('dl')).toBeNull();
  });

  it('does not match ids loosely (string param vs. numeric-looking id)', () => {
    renderAt('/people/01');
    expect(screen.getByRole('alert')).toHaveTextContent('404: Person Not Found');
  });
});
