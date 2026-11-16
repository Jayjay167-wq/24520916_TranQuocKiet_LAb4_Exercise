import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router';
import PeopleLayout from './people/PeopleLayout.jsx';
import PersonDetailSkeleton from './people/PersonDetailSkeleton.jsx';
import { SimpleForm } from './form/SimpleForm.jsx';
import ForumPage from './forum/ForumPage.jsx';
import { FORUMS } from './forum/forums.js';
import { people } from './data/people.js';
import './App.css';

// Route-level code splitting: the detail view ships as its own chunk.
const PersonDetail = lazy(() => import('./people/PersonDetail.jsx'));

const navClass = ({ isActive }) => (isActive ? 'active-link' : 'link');

export default function App() {
  return (
    <>
      <header className="app-header">
        <h1>Lab 4 – Multi-Route SPA</h1>
        <nav className="main-nav" aria-label="Main">
          <NavLink to="/people" className={navClass}>People</NavLink>
          <NavLink to="/form" className={navClass}>Form</NavLink>
          <NavLink to="/forum" className={navClass}>Forum</NavLink>
        </nav>
      </header>
      <Routes>
        <Route index element={<Navigate to="/people" replace />} />
        <Route path="people" element={<PeopleLayout people={people} />}>
          <Route index element={<p>Chọn một người trong danh sách.</p>} />
          <Route
            path=":id"
            element={
              <Suspense fallback={<PersonDetailSkeleton />}>
                <PersonDetail people={people} />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="form"
          element={
            <main>
              <SimpleForm />
            </main>
          }
        />
        <Route path="forum">
          <Route index element={<Navigate to={`/forum/${FORUMS[0]}`} replace />} />
          <Route path=":forumId" element={<ForumPage />} />
        </Route>
      </Routes>
    </>
  );
}
