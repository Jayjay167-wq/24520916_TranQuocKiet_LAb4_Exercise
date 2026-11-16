import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import PeopleLayout from './people/PeopleLayout.jsx';
import PersonDetailSkeleton from './people/PersonDetailSkeleton.jsx';
import { people } from './data/people.js';

// Route-level code splitting: the detail view ships as its own chunk.
const PersonDetail = lazy(() => import('./people/PersonDetail.jsx'));

export default function App() {
  return (
    <>
      <h1>Lab 4 – Multi-Route SPA</h1>
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
      </Routes>
    </>
  );
}
