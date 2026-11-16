import { NavLink, Outlet } from 'react-router';
import './PeopleLayout.css';

export default function PeopleLayout({ people = [] }) {
  return (
    <div className="people-frame">
      <nav className="sidebar" aria-label="People">
        {people.map((p) => (
          <NavLink
            key={p.id}
            to={`/people/${p.id}`}
            className={({ isActive }) => (isActive ? 'active-link' : 'link')}
          >
            {p.name}
          </NavLink>
        ))}
      </nav>
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
