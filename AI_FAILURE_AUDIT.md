# AI_FAILURE_AUDIT – Lab 4 In-class Exercise

Nhật ký lỗi **thật** của AI (Claude Code) trong quá trình làm Lab 4, từ T0.1 đến T3.2.

- **Nguồn:** ghi lại ngay lúc xảy ra ở từng task, sau đó đối chiếu với `git log` / `git show` để xác định commit liên quan.
- **Nguyên tắc:** chỉ ghi lỗi đã thực sự xảy ra và có bằng chứng (output test, log, lệnh kiểm chứng). Task không có lỗi thì ghi "không có".
- **Phạm vi:** code, test, cấu hình, chẩn đoán và thao tác của AI. Phần lỗi trong code mẫu của slide được tách riêng ở [mục 3](#3-lỗi-trong-code-mẫu-của-slide-đã-kiểm-chứng).

## 1. Tóm tắt

| # | Lỗi | Loại | Mức độ | Trạng thái | Commit |
|---|---|---|---|---|---|
| AI-1 | Proxy `/api` suy ra từ `PORT` → gọi vòng vào chính Vite | Cấu hình | **Cao** | Đã sửa | gây ra `9d49919`, sửa `7c60ce8` |
| AI-2 | Chẩn đoán sai AI-1 là lỗi IPv6/`localhost` | Chẩn đoán | Trung bình | Đã hoàn tác trước commit | `7c60ce8` (chỉ có fix đúng) |
| AI-3 | Route `/api/...` không tồn tại trả trang **HTML** 404, trái contract "mọi lỗi trả JSON" | Code server | Thấp | **Chưa sửa** (phát hiện khi audit) | gây ra `01f49fa` |
| AI-4 | Test CORS giả định sai cách package `cors` hoạt động | Test | Thấp | Đã sửa trước commit | `01f49fa` |
| AI-5 | Đọc CSS trong test bằng `?raw` (rỗng) rồi `import.meta.url` (không phải `file:`) | Test | Thấp | Đã sửa trước commit | `b601d07` |
| AI-6 | Test chặn `useEffect` báo nhầm vì khớp cả comment | Test | Thấp | Đã sửa trước commit | `ad04052` |
| AI-7 | `expect(...).rejects` gắn quá muộn → Unhandled Rejection | Test | Thấp | Đã sửa trước commit | `7c60ce8` |
| AI-8 | `id="inspector-heading"` viết cứng cho `aria-labelledby` | Code client | Thấp | Đã sửa trước commit | `7d544fb` |
| AI-9 | Viết contract khi chưa có slide, phải đoán một phần | Tài liệu | Thấp | Đã sửa (amend) | `49a55f6` |
| AI-10 | Định tắt **mọi** tiến trình `node.exe` để dọn sau khi kiểm tra proxy | Thao tác | Trung bình | Bị chặn, làm lại an toàn | không có commit |

**Không có:** API bịa đặt (phantom method), vòng lặp effect, cú pháp React Router v5, `defaultProps`, hay secret bị hardcode (xem [mục 4](#4-kiểm-tra-cuối)).

**Task không có lỗi AI:** T1.2 (`dbff4fe`), T2.2 (`9d6e5e2`).

## 2. Chi tiết

### AI-1 – Proxy `/api` lấy cổng từ `PORT`, gọi vòng vào chính Vite (nghiêm trọng nhất)

- **Mô tả:** `vite.config.js` tính đích proxy là `` `http://localhost:${env.PORT || 3001}` ``. `PORT` là cổng của **server**, nhưng `loadEnv(mode, dir, '')` đọc cả `process.env`. Công cụ nào đặt `PORT` cho chính Vite (ở đây preview tool đặt `PORT=5173`) thì `/api` bị proxy về `localhost:5173`, tức là gọi vào chính Vite. Hậu quả: request treo hoặc 502, trang `/forum` kẹt ở "Đang tải…".
- **File:** `client/vite.config.js`, `.env.example`.
- **Cách phát hiện:**
  - Khi chạy app thật ở T3.2, trang `/forum` không bao giờ tải xong.
  - Log Vite ghi `http proxy error … AggregateError [EADDRINUSE]`. Sau khi đổi sang `127.0.0.1` (xem AI-2), log lại ghi `connect ECONNREFUSED 127.0.0.1:5173`, cho thấy đích proxy là **5173** chứ không phải 3001.
  - `curl` thẳng vào `:3001` vẫn trả 200, nên lỗi không nằm ở server.
- **Vì sao lỗi lọt qua từ T0.1:** bước kiểm tra proxy ở T0.1 đặt `PORT=3011` cho **cả** server lẫn Vite, nên vô tình che mất lỗi. Test unit không chạy qua proxy nên cũng không bắt được.
- **Cách sửa:** chỉ đọc `API_PROXY_TARGET`, mặc định `http://localhost:3001`, không suy ra từ `PORT` nữa. Đã cập nhật `.env.example` và README (giải thích vì sao client không đọc `PORT`). Kiểm chứng lại: 10/10 request qua proxy trả 200, trang `/forum` tải bình thường.
- **Commit:** lỗi có từ `9d49919 init: scaffold lab 4 multi-route SPA`, được sửa trong `7c60ce8 feat: forum messages hook and channel switcher`.

### AI-2 – Chẩn đoán sai AI-1

- **Mô tả:** ban đầu AI đổ lỗi cho việc `localhost` resolve ra cả `::1` lẫn `127.0.0.1` (cơ chế "happy eyeballs" trên Windows), rồi đổi đích proxy thành `127.0.0.1` kèm một comment giải thích sai.
- **File:** `client/vite.config.js`, `.env.example` (bản chưa commit).
- **Cách phát hiện:** sau khi đổi, proxy vẫn 10/10 lần 502, và log ghi `ECONNREFUSED 127.0.0.1:5173`. Cổng 5173 trong log cho thấy giả thuyết IPv6 không đúng.
- **Cách sửa:** hoàn tác thay đổi `127.0.0.1` và comment sai, rồi sửa đúng nguyên nhân (AI-1). Bài học: đọc kỹ host:port đích trong log lỗi trước khi đưa ra giả thuyết.
- **Commit:** không commit nào chứa bản sai. `7c60ce8` chỉ chứa bản sửa đúng.

### AI-3 – Route `/api` không tồn tại trả trang HTML (chưa sửa)

- **Mô tả:** `project-rules.md` §5 ghi "mọi lỗi trả JSON, không trả trang HTML". Error handler JSON đã có, nhưng thiếu handler 404 cho đường dẫn `/api/...` không khớp route nào. Vì vậy Express trả trang mặc định `<!DOCTYPE html>…Cannot GET…`. Các route đã định nghĩa (`/api/messages/:forum`, kể cả kênh lạ) vẫn trả JSON đúng.
- **File:** `server/src/app.js`.
- **Cách phát hiện:** trong lúc audit, khi kiểm chứng lỗi S-3 của slide, `GET /api/forums/nasa/messages` trả `404 <!DOCTYPE html>`. Bộ test chỉ kiểm tra các route có định nghĩa nên không bắt được.
- **Cách sửa đề xuất:** thêm `app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))` sau các route, kèm test. Chưa sửa vì commit này chỉ dành cho tài liệu.
- **Commit:** lỗi có từ `01f49fa feat: express messages api`.

### AI-4 – Test CORS giả định sai cách `cors` hoạt động

- **Mô tả:** test "does not grant other origins" kỳ vọng request từ origin lạ thì **không** có header `Access-Control-Allow-Origin`. Thực tế, khi `origin` là một chuỗi, package `cors` luôn gửi đúng giá trị đã cấu hình (`http://localhost:5173`) cho mọi request. Chính trình duyệt mới là bên chặn, vì header không khớp với origin của trang.
- **File:** `server/test/messages.test.js`.
- **Cách phát hiện:** test đỏ với `actual: 'http://localhost:5173', expected: null`. Đọc `node_modules/cors/lib/index.js` (nhánh "fixed origin") để xác nhận.
- **Cách sửa:** sửa test để kiểm tra đúng tính chất an toàn: header không bao giờ là origin lạ và không bao giờ là `*`.
- **Commit:** sửa trước khi commit, trong `01f49fa`.

### AI-5 – Đọc file CSS trong test bằng cách không chạy được trong Vitest

- **Mô tả:** test kiểm tra grid `minmax(280px, 1fr) 2fr` của `PeopleLayout`.
  - Lần 1 dùng `import css from './PeopleLayout.css?raw'` và nhận về chuỗi rỗng, vì Vitest mặc định bỏ qua CSS (`css: false`).
  - Lần 2 dùng `readFileSync(new URL('./PeopleLayout.css', import.meta.url))` và bị lỗi `TypeError: The URL must be of scheme file`, vì dưới jsdom `import.meta.url` không phải URL `file:`.
- **File:** `client/src/people/PeopleLayout.test.jsx`.
- **Cách phát hiện:** test đỏ (`expected '' to match /display:\s*grid/`), rồi file test không load được.
- **Cách sửa:** `readFileSync(resolve(process.cwd(), 'src/people/PeopleLayout.css'))`, kèm comment giải thích vì sao.
- **Commit:** sửa trước khi commit, trong `b601d07 feat: router layout`.

### AI-6 – Test chặn `useEffect` báo nhầm vì khớp cả comment

- **Mô tả:** `noUseEffect.test.js` dò `/\buseEffect\b/` trên toàn bộ mã nguồn, nên dòng comment "no useEffect" trong `SimpleForm.jsx` bị coi là vi phạm và test đỏ, dù code không hề gọi `useEffect`.
- **File:** `client/src/form/noUseEffect.test.js`.
- **Cách phát hiện:** test đỏ `expected [ 'SimpleForm.jsx' ] to deeply equal []`. Đọc lại file thì chỉ thấy comment.
- **Cách sửa:** bỏ comment `//` và `/* */` trước khi dò, và thêm một test tự kiểm tra rằng lời gọi `useEffect(...)` thật vẫn bị bắt. Cách này giữ được tác dụng của test chặn thay vì nới lỏng nó.
- **Commit:** sửa trước khi commit, trong `ad04052 feat: form context`.

### AI-7 – `expect(...).rejects` gắn sau khi promise đã reject

- **Mô tả:** trong test `postMessage` trả 400, `await expect(posting).rejects.toThrow(...)` được gọi **sau** khi stub đã trả lời. Lúc đó promise đã reject mà chưa có handler, nên Vitest báo "Vitest caught 1 unhandled error" kèm `PromiseRejectionHandledWarning`, dù 12/12 test vẫn pass.
- **File:** `client/src/forum/useForumMessages.test.jsx`.
- **Cách phát hiện:** output của Vitest (mục "Unhandled Errors"). Mỗi lần chạy test đều grep `unhandled|warn`, nên lỗi này không bị bỏ qua.
- **Cách sửa:** tạo assertion `.rejects` **trước** khi stub trả lời, rồi mới `await`.
- **Commit:** sửa trước khi commit, trong `7c60ce8`.

### AI-8 – `id` viết cứng cho `aria-labelledby`

- **Mô tả:** bản nháp đầu của inspector dùng `<section aria-labelledby="inspector-heading">` với `<h2 id="inspector-heading">`. Nếu trang render hai `SimpleForm` thì id bị trùng và `aria-labelledby` trỏ sai. Lỗi này đi ngược nguyên tắc `useId` của chính task T2.2.
- **File:** `client/src/form/SimpleForm.jsx`.
- **Cách phát hiện:** AI tự rà lại code trước khi commit. Test chưa bắt được lỗi này.
- **Cách sửa:** `const inspectorHeadingId = useId();`.
- **Commit:** sửa trước khi commit, trong `7d544fb feat: inspector output`.

### AI-9 – Viết contract khi chưa có slide

- **Mô tả:** ở T0.2, file slide chưa được đính kèm nên AI viết `project-rules.md` chỉ dựa trên WBS. Một số chi tiết phải đoán và lệch với slide:
  - Hook trả `loading / error / data` (slide ghi `{ data, loading, postMessage }`).
  - Không biết tên field bắt buộc của POST (`text`, `author`).
  - Không biết chữ 404 và class của NavLink.
- **File:** `project-rules.md`.
- **Cách phát hiện:** AI đã báo ngay khi bàn giao rằng contract "cần đối chiếu lại với slide 23–27". Khi người dùng gửi slide, AI đối chiếu và viết lại.
- **Cách sửa:** viết lại theo slide 23–27, thêm mục "Khác với slide". Theo yêu cầu của người dùng, bản sửa được amend vào commit T0.2.
- **Commit:** `49a55f6 docs: define contract spec and WBS` (bản đã amend; bản gốc không còn trong lịch sử).

### AI-10 – Định tắt mọi tiến trình `node.exe`

- **Mô tả:** ở T0.1, để dọn dẹp sau khi kiểm tra proxy, AI chạy `taskkill //F //IM node.exe`. Lệnh này sẽ tắt **toàn bộ** tiến trình Node trên máy của người dùng, không chỉ hai tiến trình AI vừa mở.
- **File:** không có (lệnh shell).
- **Cách phát hiện:** auto-mode classifier của Claude Code chặn lệnh với lý do "Destructive or Unwanted Actions".
- **Cách sửa:** viết một script Node tự `spawn` server và Vite, kiểm tra xong thì chỉ `kill()` đúng hai tiến trình con đó. Từ đó trở đi, mọi script kiểm tra đều tự dọn tiến trình của mình (`server-smoke.mjs`, `slow-stack.mjs` tự thoát sau 3 phút).
- **Commit:** không có.

### Sự cố công cụ (không phải lỗi code)

- **T3.1:** heredoc trong bash báo `unexpected EOF while looking for matching '` khi file test chứa dấu nháy cong (’). AI chuyển sang ghi file bằng tool Write. Không ảnh hưởng tới code.

### Đã xem xét, không phải lỗi

- **T1.2:** lần đầu mở `/people/2` ở chế độ dev, skeleton hiện lâu hơn. Nguyên nhân là Vite đang transform chunk lazy; mở lại thì nội dung hiện ngay.
- **T3.2:** ở chế độ dev, request `messages/nasa` đầu tiên luôn `ERR_ABORTED`. Đây là `StrictMode` mount → cleanup → mount lại effect; cleanup hủy request đầu đúng như thiết kế.

## 3. Lỗi trong code mẫu của slide (đã kiểm chứng)

Mỗi lỗi dưới đây đều được **chạy thật** để xác nhận. Các file kiểm chứng nằm ngoài repo (scratchpad) hoặc là file test tạm, đã xóa ngay sau khi chạy.

| # | Slide | Lỗi | Kết quả chạy thật | Repo xử lý |
|---|---|---|---|---|
| S-1 | 27 | `if (!req.body.text \|\| !req.body.author)` – Express 5 để `req.body` là `undefined` khi request không có body | POST không body → **500** `Cannot read properties of undefined (reading 'text')` | `parseMessageInput(req.body)` chịu được `undefined`; test "400 (not 500) when the request has no body at all" |
| S-2 | 27 | `{ id: crypto.randomUUID(), ...req.body, timestamp }` – spread đặt **sau** `id` | body `{ id: 'hijacked' }` → message có `id = 'hijacked'` | Chỉ lấy `text`, `author`; `id`/`timestamp` do server đặt; test "client cannot override id or timestamp" |
| S-3 | 26, 16 | Hook fetch `/api/forums/${id}/messages` (slide 26) và `/api/channels/${id}/messages` (slide 16), nhưng server slide 27 là `/api/messages/:forum` | `GET /api/forums/nasa/messages` → **404**, `GET /api/channels/nasa/messages` → **404**, `GET /api/messages/nasa` → 200 | Client fetch `/api/messages/${encodeURIComponent(forumId)}` |
| S-4 | 26 | Không kiểm tra `res.ok`, gán thẳng `setData(result)` | Server trả lỗi JSON `{ error }` → `data` thành object → component crash `TypeError: data.map is not a function` | Hook kiểm tra `res.ok`, lỗi đưa vào `error` chứ không vào `data`; test "exposes an error … on HTTP failure" |

Cách kiểm chứng:

- **S-1:** app Express 5 tối giản chép đúng handler của slide, gọi `POST` không body.
- **S-2, S-3:** script Node gọi đúng biểu thức spread của slide, và gọi 3 URL vào `createApp()` của repo (route giống slide 27).
- **S-4:** file Vitest tạm chép nguyên văn hook slide 26, stub `fetch` trả `{ ok: false, status: 404, json: { error } }`, render một component dùng `data.map`.

### Mâu thuẫn giữa các slide (không phải lỗi runtime)

- **Slide 27** hardcode `cors({ origin: 'http://localhost:5173' })`, trong khi slide 5 và 29 cấm hardcode config. Repo đọc từ `CORS_ORIGIN`.
- **Slide 2** dùng `createBrowserRouter` + `RouterProvider`, còn slide 10 và 23 dùng `<Routes>` / `<Route element>`. Repo theo slide 10/23 (đúng contract Sprint 1).
- **Slide 24** đặt `value={{ values, errors, setValues }}`, nhưng phần `FormContext` cùng slide lại ghi `handleChange`. Repo dùng `handleChange`.
- **Đánh số slide:** tiêu đề "Slide 23–27" thực ra nằm ở trang 22–26 của file pptx.

Mọi điểm khác slide có chủ đích đều được liệt kê trong `project-rules.md` §6.

## 4. Kiểm tra cuối

Chạy ngày 2026-11-16 trên commit `7c60ce8` (trước commit audit này).

| Kiểm tra | Kết quả |
|---|---|
| `npm --prefix client test` | 13 file, **80/80 pass**, không có warning hay unhandled error |
| `npm --prefix server test` | 4 suite, **31/31 pass** |
| `npm --prefix client run build` | Build OK, không warning; `PersonDetail` tách thành chunk riêng |
| `<Switch>`, `activeClassName`, `activeStyle`, `exact`, `component=`, `<Redirect>`, `useHistory`, `withRouter`, `react-router-dom` | Không có trong code. `Switch` và `activeClassName` chỉ xuất hiện ở `project-rules.md` §3, trong câu ghi luật cấm |
| `defaultProps` | Không có trong code. Chỉ xuất hiện ở `project-rules.md` §7, trong câu ghi luật cấm |
| `useEffect` trong `client/src/form` | Không có lời gọi nào. Chỉ có 1 comment (`SimpleForm.jsx:30`) và test chặn `useEffect` |
| Secret: `mongodb://`, `postgres://`, `password=`, `secret=`, `api_key=`, `token=`, private key, AWS key | Không có |
| `.env` | Không bị track và **chưa từng** xuất hiện trong lịch sử git; chỉ commit `.env.example` |
| `localhost:5173` / `localhost:3001` trong code | Chỉ là giá trị mặc định cho dev trong `server/src/config.js` và `client/vite.config.js` (có env override), trong test và trong docs |

## 5. Bài học

1. **Test xanh chưa đủ.** AI-1 tồn tại suốt từ T0.1 tới T3.2 dù mọi test đều xanh, và chỉ lộ ra khi chạy cả hệ thống thật. Bước kiểm tra tích hợp cũng phải tránh vô tình che lỗi, như việc đặt `PORT` giống nhau cho hai tiến trình ở T0.1.
2. **Đọc log trước khi đưa ra giả thuyết.** AI-2 tốn một vòng sửa sai, chỉ vì không đọc kỹ host:port đích trong log lỗi.
3. **Test sai cũng là lỗi.** AI-4, AI-5, AI-6, AI-7 đều nằm ở chính test. Khi test đỏ, phải xét cả khả năng giả định của test bị sai, chứ không mặc định là code sai.
4. **Không chép nguyên code mẫu của slide.** Cả 4 lỗi S-1 đến S-4 đều tái hiện được, và 3 trong số đó gây crash hoặc lỗ hổng bảo mật.
5. **Lệnh shell phải giới hạn đúng phạm vi** (AI-10): chỉ dừng các tiến trình chính mình đã mở.
