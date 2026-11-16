import { Routes, Route, Navigate } from 'react-router';
import PeopleLayout from './people/PeopleLayout.jsx';
import { people } from './data/people.js';

export default function App() {
  return (
    <>
      <h1>Lab 4 – Multi-Route SPA</h1>
      <Routes>
        <Route index element={<Navigate to="/people" replace />} />
        <Route path="people" element={<PeopleLayout people={people} />}>
          <Route index element={<p>Chọn một người trong danh sách.</p>} />
        </Route>
      </Routes>
    </>
  );
}
