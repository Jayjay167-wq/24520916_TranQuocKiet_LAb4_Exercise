import { render, screen, within, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from '../App.jsx';
import { createFetchStub } from './testFetch.js';

const msgs = {
  nasa: [{ id: 'n1', text: 'Liftoff', author: 'mission-control', timestamp: '2026-11-16T10:00:00.000Z' }],
  'esports-tribunal': [{ id: 'e1', text: 'Appeal filed', author: 'Himass', timestamp: '2026-11-16T10:01:00.000Z' }],
  notNasa: [{ id: 'x1', text: 'Just vibes', author: 'backyard', timestamp: '2026-11-16T10:02:00.000Z' }],
};
const forumOf = (url) => decodeURIComponent(url.split('/').pop());

let stub;
beforeEach(() => {
  stub = createFetchStub();
  vi.stubGlobal('fetch', stub.fetch);
});
afterEach(() => vi.unstubAllGlobals());

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

async function respondLastGet() {
  const call = stub.lastGet();
  await act(async () => call.respond(200, msgs[forumOf(call.url)]));
}

describe('/forum page', () => {
  it('redirects /forum to the first channel and is reachable from the main nav', async () => {
    renderAt('/forum');
    const mainNav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(mainNav).getByRole('link', { name: 'Forum' })).toHaveAttribute('aria-current', 'page');
    expect(stub.lastGet().url).toBe('/api/messages/nasa');
  });

  it('renders a channel switcher with the 3 channels and marks the current one', () => {
    renderAt('/forum/esports-tribunal');
    const nav = screen.getByRole('navigation', { name: 'Kênh' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['nasa', 'esports-tribunal', 'notNasa']);
    expect(within(nav).getByRole('link', { name: 'esports-tribunal' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'esports-tribunal' })).toHaveClass('active-link');
  });

  it('shows a busy state, then messages as <dl> with keyed dt/dd pairs', async () => {
    const { container } = renderAt('/forum/nasa');
    const region = screen.getByRole('region', { name: /tin nhắn/i });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải');

    await respondLastGet();
    expect(region).toHaveAttribute('aria-busy', 'false');
    const dl = container.querySelector('dl.message-list');
    expect(within(dl).getByRole('term')).toHaveTextContent('mission-control');
    expect(within(dl).getByRole('definition')).toHaveTextContent('Liftoff');
    expect(within(dl).getByRole('term').querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-11-16T10:00:00.000Z'
    );
  });

  it('rapid clicks between channels abort the older requests; only the last channel is shown', async () => {
    const user = userEvent.setup();
    renderAt('/forum/nasa');
    const nav = screen.getByRole('navigation', { name: 'Kênh' });

    await user.click(within(nav).getByRole('link', { name: 'esports-tribunal' }));
    await user.click(within(nav).getByRole('link', { name: 'notNasa' }));

    const [nasa, esports, notNasa] = stub.gets();
    expect([nasa, esports, notNasa].map((c) => forumOf(c.url))).toEqual([
      'nasa',
      'esports-tribunal',
      'notNasa',
    ]);
    expect(nasa.aborted).toBe(true);
    expect(esports.aborted).toBe(true);
    expect(notNasa.aborted).toBe(false);

    await act(async () => notNasa.respond(200, msgs.notNasa));
    expect(screen.getByText('Just vibes')).toBeInTheDocument();
    expect(screen.queryByText('Liftoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Appeal filed')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('notNasa');
  });

  it('shows an empty-state message for a channel without messages', async () => {
    renderAt('/forum/nasa');
    await act(async () => stub.lastGet().respond(200, []));
    expect(screen.getByText('Chưa có tin nhắn nào.')).toBeInTheDocument();
  });

  it('shows the load error as an alert', async () => {
    renderAt('/forum/nasa');
    await act(async () => stub.lastGet().respond(500, { error: 'Internal server error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Internal server error');
  });

  it('renders 404 for an unknown channel without calling the API', () => {
    renderAt('/forum/mars');
    expect(screen.getByRole('alert')).toHaveTextContent('404: Kênh không tồn tại');
    expect(stub.fetch).not.toHaveBeenCalled();
  });

  describe('message form', () => {
    it('uses InputField (aria-invalid) and blocks empty submits client-side', async () => {
      const user = userEvent.setup();
      renderAt('/forum/nasa');
      await respondLastGet();

      await user.click(screen.getByRole('button', { name: 'Gửi tin' }));
      expect(screen.getByLabelText('Tên')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Nội dung')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Nội dung')).toHaveAccessibleDescription('Vui lòng nhập nội dung');
      expect(stub.calls.some((c) => c.method === 'POST')).toBe(false);
    });

    it('posts to the current channel, clears the text, keeps the author, shows the refetched list', async () => {
      const user = userEvent.setup();
      renderAt('/forum/notNasa');
      await respondLastGet();

      await user.type(screen.getByLabelText('Tên'), 'tester');
      await user.type(screen.getByLabelText('Nội dung'), 'hello forum');
      await user.click(screen.getByRole('button', { name: 'Gửi tin' }));

      const post = stub.calls.find((c) => c.method === 'POST');
      expect(post.url).toBe('/api/messages/notNasa');
      expect(JSON.parse(post.init.body)).toEqual({ author: 'tester', text: 'hello forum' });
      expect(screen.getByRole('button', { name: 'Đang gửi…' })).toBeDisabled();

      const created = { id: 'x2', text: 'hello forum', author: 'tester', timestamp: '2026-11-16T10:09:00.000Z' };
      await act(async () => post.respond(201, created));
      await waitFor(() => expect(stub.gets()).toHaveLength(2));
      await act(async () => stub.lastGet().respond(200, [...msgs.notNasa, created]));

      expect(screen.getByText('hello forum', { selector: 'dd' })).toBeInTheDocument();
      expect(screen.getByLabelText('Nội dung')).toHaveValue('');
      expect(screen.getByLabelText('Tên')).toHaveValue('tester');
      expect(screen.getByLabelText('Nội dung')).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows the server error if the POST fails and keeps what the user typed', async () => {
      const user = userEvent.setup();
      renderAt('/forum/nasa');
      await respondLastGet();

      await user.type(screen.getByLabelText('Tên'), 'tester');
      await user.type(screen.getByLabelText('Nội dung'), 'boom');
      await user.click(screen.getByRole('button', { name: 'Gửi tin' }));
      await act(async () =>
        stub.calls.find((c) => c.method === 'POST').respond(400, { error: 'Missing required fields' })
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Missing required fields');
      expect(screen.getByLabelText('Nội dung')).toHaveValue('boom');
      expect(screen.getByRole('button', { name: 'Gửi tin' })).toBeEnabled();
    });
  });
});
