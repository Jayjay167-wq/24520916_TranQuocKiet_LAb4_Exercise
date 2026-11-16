# project-rules – Lab 4 In-class Exercise

Contract spec cho toàn bộ repo. Mọi task trong `TASK_DECOMPOSITION.md` phải tuân theo file này.

> Nguồn: slide Lab 4 – code contract slide 23–27 (Sprint 1–3), slide 8 (quy trình), slide 34 (cấu trúc repo); WBS trong `TASK_DECOMPOSITION.md`.
> Chỗ nào repo **cố ý khác slide** được ghi rõ trong mục "Khác với slide".

## 1. Cấu trúc repo

```
project-rules.md        contract spec (file này)
TASK_DECOMPOSITION.md   WBS theo sprint
AI_FAILURE_AUDIT.md     (Phase 4) lỗi AI thật đã gặp + cách sửa
.env.example            template biến môi trường, không chứa secret
client/                 Vite + React 19, react-router v7, vitest + Testing Library
server/                 Express 5 + cors, test bằng node:test
```

- Client gọi API qua đường dẫn tương đối `/api/...`; Vite dev server proxy `/api` → server. Không hardcode URL server trong code React.
- Server đọc mọi config từ env (`server/src/config.js`). File `.env` (không commit) đặt ở root, dùng chung cho client và server.

## 2. Quy trình làm việc (slide 8)

1. **Contract** – đọc lại phần tương ứng trong file này.
2. **Fail test** – viết test trước, chạy thấy đỏ.
3. **Implement** – code tối thiểu cho test xanh.
4. **Refactor** – dọn code, test vẫn xanh.
5. **Commit** – mỗi task trong WBS đúng 1 commit atomic, conventional commit message đúng như WBS ghi.

Trước mỗi commit: `npm test` ở `client/` và `server/` đều pass; task có đụng client thì `npm run build` không lỗi. Không có warning trong console DevTools (slide 12).

## 3. Contract – Sprint 1: Router Master-Detail (slide 23, 9–11)

**Routing:** react-router v7, `<Routes>` / `<Route element={...}>`, layout lồng nhau qua `<Outlet />`. Cấm cú pháp v5 (`<Switch>`, `component=`, `exact`, `activeClassName`).

**`PeopleLayout.jsx`** – `export default function PeopleLayout({ people })`

- Khung `div.people-frame` gồm `nav.sidebar` và `main.content-area`.
- Mỗi người là một `<NavLink key={p.id} to={`/people/${p.id}`}>`, `className={({ isActive }) => isActive ? 'active-link' : 'link'}`.
- `main.content-area` render `<Outlet />`.
- CSS Grid: `grid-template-columns: minmax(280px, 1fr) 2fr` (slide 11).

**`PersonDetail.jsx`** – `export default function PersonDetail({ people })`

- `const { id } = useParams();` → `people.find((p) => p.id === id)`.
- Không tìm thấy → `<div role="alert">404: Person Not Found</div>`.
- Tìm thấy → `<dl className="person-details">` với cặp `<dt>Name</dt><dd>…</dd>`, `<dt>Role</dt><dd>…</dd>`.
- Dữ liệu người: `{ id: string, name: string, role: string }`.

**Lazy loading (slide 9 – Ex 1.1):** `PersonDetail` load bằng `React.lazy(() => import('./PersonDetail'))`, bọc `<Suspense>` với fallback là skeleton cùng kích thước (không layout shift), có `aria-busy="true"` và `aria-live="polite"`.

**Commits:** `feat: router layout`, `feat: detail route handling`.

## 4. Contract – Sprint 2: Context Form Engine (slide 24–25, 13–15)

**`FormContext.js`**

```js
export const FormContext = createContext(null);
export function useFormContext() // = useContext(FormContext); ném lỗi rõ ràng nếu dùng ngoài <SimpleForm>
```

**`SimpleForm.jsx`** – `export const SimpleForm`

- `const [values, setValues] = useState(initial);`
- `const errors = validateForm(values);` – tính **đồng bộ trong render**, `validateForm` là hàm thuần (test riêng được).
- `const isValid = Object.keys(errors).length === 0;` (slide 14).
- Bọc UI bằng `<FormContext.Provider value={{ values, errors, isValid, submitAttempted, handleChange }}>`.
- Form 3 field: tên, email, tuổi. Lỗi chỉ hiển thị sau lần submit đầu (`submitAttempted`), nhưng luôn được tính lại trong mỗi render.
- Luật `validateForm` (trả `{}` khi hợp lệ):
  - `name`: bắt buộc, sau khi trim ≥ 2 ký tự.
  - `email`: bắt buộc, dạng `x@y.z`, không có khoảng trắng.
  - `age`: bắt buộc, số nguyên, từ 1 đến 120.

**`InputField.jsx`** – `export const InputField = ({ label, error, ...props })`

- `const id = useId(); const errorId = `${id}-error`;`
- `<label htmlFor={id}>` + `<input {...props} id={id} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />` – `...props` đặt **trước** để prop truyền vào không ghi đè được `id` / `aria-*`.
- Có lỗi → `<span id={errorId} role="alert">{error}</span>`; không lỗi thì không render span và không có `aria-describedby`.

**`ShowData.jsx`** – `export const ShowData = ({ data })`

- Chỉ hiển thị sau khi submit hợp lệ; submit không hợp lệ thì ẩn (kể cả khi trước đó đã hiện).
- Dữ liệu là snapshot lúc submit (`name`/`email` đã trim, `age` là number), không đổi theo khi người dùng sửa field cho tới lần submit sau.
- Bọc trong vùng `aria-live="polite"` có sẵn từ đầu để screen reader đọc kết quả.
- `<dl className="json-inspector">`, mỗi cặp key/value là `<div key={key} className="data-row"><dt>{key}</dt><dd>{String(val)}</dd></div>`. Không dump `JSON.stringify`.

**Ràng buộc:** **không có `useEffect`** trong thư mục form (slide 13: không chuỗi effect sync state / validate).

**Commits:** `feat: form context`, `feat: input field validation`, `feat: inspector output`.

## 5. Contract – Sprint 3: Full-stack (slide 26–27, 16–17)

### Server – Express (slide 27)

| Method | Path | Điều kiện | Response |
|---|---|---|---|
| GET | `/api/messages/:forum` | – | `200` + mảng message của kênh |
| POST | `/api/messages/:forum` | thiếu `text` hoặc `author` | `400` + `{ "error": "Missing required fields" }` |
| POST | `/api/messages/:forum` | đủ `text` và `author` | `201` + message mới `{ id, text, author, timestamp }` |

- `id` sinh bằng `crypto.randomUUID()`, `timestamp` là thời điểm server nhận.
- `app.use(cors({ origin }))` + `express.json()`.
- Dữ liệu lưu trong memory cho 3 kênh: `nasa`, `esports-tribunal`, `notNasa`.

### Client – `useForumMessages.js` (slide 26)

`export const useForumMessages = (forumId) => ({ data, loading, postMessage })`

- Trong `useEffect([forumId])`: tạo `AbortController`, `fetch(..., { signal })` bằng async/await trong `try/catch/finally`.
- Mọi `setState` (data, lỗi, `loading`) chỉ chạy khi `!controller.signal.aborted` → đổi kênh nhanh thì response cũ không ghi đè kênh mới.
- Cleanup: `return () => controller.abort();`.
- `postMessage(payload)`: POST lên server rồi refetch kênh hiện tại.

### Client – trang chuyển kênh (slide 16–17)

- Chuyển giữa `nasa` / `esports-tribunal` / `notNasa`.
- Danh sách message render bằng `<dl>` với `<React.Fragment key={msg.id}>` bọc mỗi cặp `<dt>`/`<dd>`.
- Kiểm tra thủ công: DevTools → Network → Slow 3G, đổi kênh liên tục, request cũ hiện `(canceled)`. Ghi cách làm vào README.

## 6. Khác với slide (có chủ đích)

| Slide | Repo | Lý do |
|---|---|---|
| Slide 26 fetch `/api/forums/${forumId}/messages`, slide 16 fetch `/api/channels/${channelId}/messages` | Client fetch `/api/messages/${forumId}` | Phải khớp route server ở slide 27; 2 URL trong slide 16/26 không có trên server. |
| Slide 27 `cors({ origin: 'http://localhost:5173' })` | `origin` đọc từ `CORS_ORIGIN` | Không hardcode config (slide 5, 29). |
| Slide 27 `{ id: crypto.randomUUID(), ...req.body, timestamp }` | Chỉ lấy `text`, `author` từ body; `id`, `timestamp` do server đặt | Với spread, client gửi `id`/`timestamp` trong body sẽ ghi đè giá trị server sinh ra. |
| Slide 27 dùng `require` (CommonJS) | ES modules (`import`) | Đồng nhất với client. |
| Slide 24 Provider `value={{ values, errors, setValues }}`, phần FormContext ghi `handleChange` | Dùng `handleChange` | Field không cần biết cấu trúc state; một API duy nhất cho mọi field. |
| Không có trong slide | Kênh ngoài 3 kênh hợp lệ → `404` + `{ "error": "Unknown forum" }` | Lưu trữ memory chỉ có 3 kênh cố định. |

## 7. Quy ước code

- ES modules ở cả client và server.
- Component React: function component, file `.jsx`, tên PascalCase. Giá trị mặc định dùng default parameter, không dùng `defaultProps` (slide 4).
- Test client đặt cạnh file nguồn (`*.test.jsx`); test server trong `server/test/`.
- Test truy vấn theo role / label (Testing Library), không dựa vào class hay cấu trúc DOM khi có cách tốt hơn.
- Button chỉ có icon phải có `aria-label` (slide 29).
- Không commit `.env`, `node_modules/`, `dist/`.
