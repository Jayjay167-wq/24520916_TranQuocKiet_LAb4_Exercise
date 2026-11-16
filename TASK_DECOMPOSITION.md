# TASK_DECOMPOSITION – Lab 4 In-class Exercise

Quy trình mỗi task: Contract → Fail test → Implement → Refactor. Mỗi task 1 commit.

## Phase 0 – Setup
- [x] **T0.1** Scaffold `client/` (Vite + React 19, react-router v7, vitest + testing-library) và `server/` (express, cors), proxy `/api` → server
  - Commit: `init: scaffold lab 4 multi-route SPA`
- [x] **T0.2** `project-rules.md`, `TASK_DECOMPOSITION.md`, `.env.example`
  - Commit: `docs: define contract spec and WBS`

## Phase 1 – Sprint 1: Router Master-Detail
- [x] **T1.1** `PeopleLayout.jsx`: NavLink (active class) + Outlet, CSS Grid `minmax(280px, 1fr) 2fr`
  - Done khi: test NavLink/active pass
  - Commit: `feat: router layout`
- [x] **T1.2** `PersonDetail.jsx`: useParams + `people.find()` + 404 `role="alert"` + `<dl>`; lazy + Suspense skeleton (`aria-busy`, `aria-live`)
  - Done khi: test id hợp lệ / 404 pass, build không warning
  - Commit: `feat: detail route handling`

## Phase 2 – Sprint 2: Context Form Engine
- [x] **T2.1** `FormContext.js` + `SimpleForm.jsx`, validate đồng bộ trong render, không useEffect
  - Done khi: test `validateForm` pass
  - Commit: `feat: form context`
- [x] **T2.2** `InputField.jsx`: useId, `aria-invalid`, `aria-describedby`
  - Done khi: test aria pass
  - Commit: `feat: input field validation`
- [x] **T2.3** `ShowData.jsx` hiển thị `<dl>` khi submit hợp lệ
  - Done khi: test submit pass, thư mục form không có useEffect
  - Commit: `feat: inspector output`

## Phase 3 – Sprint 3: Full-stack
- [x] **T3.1** Express server: CORS, GET/POST `/api/messages/:forum`, POST thiếu field → 400, hợp lệ → 201 (`crypto.randomUUID()`), config từ env
  - Done khi: test 200/400/201 pass
  - Commit: `feat: express messages api`
- [ ] **T3.2** Hook `useForumMessages` (AbortController) + trang chuyển kênh `nasa` / `esports-tribunal` / `notNasa`
  - Done khi: test đổi kênh nhanh hủy request cũ, kiểm tra Slow 3G ghi trong README
  - Commit: `feat: forum messages hook and channel switcher`

## Phase 4 – Audit
- [ ] **T4.1** `AI_FAILURE_AUDIT.md`, chạy lại toàn bộ test + build
  - Commit: `docs: ai failure audit`
