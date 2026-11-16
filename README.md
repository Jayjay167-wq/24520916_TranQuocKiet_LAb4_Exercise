# Lab 4 – Multi-Route SPA, Context Form Engine & Full-stack Forum

In-class exercise Lab 4 (UIT – S3T). Contract spec: [project-rules.md](project-rules.md) · WBS: [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md).

| Route | Nội dung | Sprint |
|---|---|---|
| `/people`, `/people/:id` | Master-detail: `NavLink` + `Outlet`, `useParams`, 404, lazy + Suspense skeleton | 1 |
| `/form` | Form 3 field validate đồng bộ trong render (Context, `useId`, aria), `ShowData` | 2 |
| `/forum/:forumId` | Chuyển kênh `nasa` / `esports-tribunal` / `notNasa`, hook `useForumMessages` (AbortController), gửi tin | 3 |

## Chạy dự án

Yêu cầu Node 22+ (đã chạy với Node 24).

```bash
cp .env.example .env
```

```bash
npm --prefix server install
```

```bash
npm --prefix client install
```

Mở 2 terminal:

```bash
npm --prefix server start
```

```bash
npm --prefix client run dev
```

Mở http://localhost:5173. Client gọi `/api/...`, Vite proxy sang server theo `API_PROXY_TARGET` (mặc định `http://localhost:3001`).

> Client **không** đọc `PORT` (đó là cổng của server). Nếu một công cụ đặt `PORT` cho Vite mà proxy lại suy ra từ `PORT`, `/api` sẽ gọi vòng vào chính Vite.

### Test & build

```bash
npm --prefix client test
```

```bash
npm --prefix server test
```

```bash
npm --prefix client run build
```

## Kiểm tra hủy request bằng Slow 3G (Sprint 3)

Mục tiêu: khi đổi kênh nhanh, request của kênh cũ bị `AbortController` hủy, và danh sách cuối cùng là của kênh được chọn sau cùng (slide 17, 26).

1. Chạy server và client như trên, mở Chrome tới http://localhost:5173/forum/nasa.
2. Mở DevTools (`F12`) → tab **Network**.
3. Tick **Disable cache**. Ở dropdown throttling (mặc định **No throttling**) chọn **Slow 3G**.
4. Bấm filter **Fetch/XHR** để chỉ thấy request API.
5. Bấm nhanh liên tiếp: **esports-tribunal** → **notNasa** (trong vòng ~1 giây, trước khi request đầu xong).
6. Quan sát cột **Status** trong Network:
   - `messages/esports-tribunal` → **(canceled)** — bị hủy bởi cleanup `controller.abort()` khi `forumId` đổi.
   - `messages/notNasa` → **200**.
7. Quan sát giao diện:
   - Trong lúc chờ: tiêu đề đã là `#notNasa`, vùng tin nhắn hiện "Đang tải…" (`aria-busy="true"`), **không** hiện tin của kênh trước.
   - Khi xong: chỉ hiện tin của `notNasa`. Không có lúc nào tin của `esports-tribunal` chớp lên.
8. Tab **Console**: không có lỗi. `AbortError` được hook bỏ qua có chủ đích (`if (!controller.signal.aborted)`), không log ra.
9. Đặt throttling về **No throttling** khi xong.

Ghi chú khi đọc Network ở chế độ dev:

- Lần đầu vào trang sẽ thấy một request `messages/nasa` **(canceled)** ngay lập tức. Đó là React `StrictMode` (chỉ ở dev) mount → cleanup → mount lại effect; cleanup abort request đầu. Build production không có hiện tượng này.
- Request bị hủy ở phía trình duyệt; server có thể vẫn nhận request đó. Việc hủy chỉ đảm bảo client không nhận/không áp dụng response cũ.

### Đã kiểm tra

- Tự động: `client/src/forum/useForumMessages.test.jsx` và `client/src/forum/ForumPage.test.jsx` dùng fetch giả để kiểm tra (a) 2 request đầu có `signal.aborted === true` khi đổi kênh nhanh, (b) response cũ về **sau** response mới vẫn bị bỏ qua nhờ guard `signal.aborted`, (c) lỗi của request cũ không thành lỗi của kênh mới.
- Thủ công (2026-11-16): trong browser pane của Claude Code không có dropdown Slow 3G, nên đã thay bằng một proxy làm chậm 2 giây đặt giữa Vite và server. Đổi kênh nasa → esports-tribunal → notNasa: Network ghi `esports-tribunal` = `net::ERR_ABORTED` (DevTools hiển thị là "(canceled)"), `notNasa` = 200; giao diện chỉ hiện tin của `notNasa`; console sạch. Các bước Slow 3G ở trên là quy trình tương đương để tự làm lại trong Chrome DevTools.
