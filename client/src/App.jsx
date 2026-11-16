import { Routes, Route } from 'react-router';

export default function App() {
  return (
    <main>
      <h1>Lab 4 – Multi-Route SPA</h1>
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </main>
  );
}
