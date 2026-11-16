import { renderHook, act, waitFor } from '@testing-library/react';
import { useForumMessages } from './useForumMessages.js';
import { createFetchStub } from './testFetch.js';

const nasaMsgs = [{ id: 'n1', text: 'Liftoff', author: 'mc', timestamp: '2026-11-16T10:00:00.000Z' }];
const esportsMsgs = [{ id: 'e1', text: 'Appeal', author: 'Himass', timestamp: '2026-11-16T10:01:00.000Z' }];
const notNasaMsgs = [{ id: 'x1', text: 'Vibes', author: 'rk', timestamp: '2026-11-16T10:02:00.000Z' }];

let stub;

function useStub(options) {
  stub = createFetchStub(options);
  vi.stubGlobal('fetch', stub.fetch);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useForumMessages', () => {
  it('fetches /api/messages/:forumId with an AbortSignal and exposes data + loading', async () => {
    useStub();
    const { result } = renderHook(() => useForumMessages('nasa'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(stub.calls).toHaveLength(1);
    expect(stub.calls[0].url).toBe('/api/messages/nasa');
    expect(stub.calls[0].init.signal).toBeInstanceOf(AbortSignal);

    await act(async () => stub.calls[0].respond(200, nasaMsgs));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(nasaMsgs);
    expect(result.current.error).toBeNull();
  });

  it('rapid channel switching aborts every older request; final data is the last channel', async () => {
    useStub();
    const { result, rerender } = renderHook(({ id }) => useForumMessages(id), {
      initialProps: { id: 'nasa' },
    });
    rerender({ id: 'esports-tribunal' });
    rerender({ id: 'notNasa' });

    const [nasa, esports, notNasa] = stub.gets();
    expect(nasa.url).toBe('/api/messages/nasa');
    expect(esports.url).toBe('/api/messages/esports-tribunal');
    expect(notNasa.url).toBe('/api/messages/notNasa');
    expect(nasa.aborted).toBe(true);
    expect(esports.aborted).toBe(true);
    expect(notNasa.aborted).toBe(false);

    await act(async () => notNasa.respond(200, notNasaMsgs));
    expect(result.current.data).toEqual(notNasaMsgs);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull(); // AbortError of old requests is not an error
  });

  it('signal.aborted guard: a stale response arriving AFTER the newer one is ignored', async () => {
    // Simulate a response that was already in flight when abort() ran (fetch does not reject).
    useStub({ rejectOnAbort: false });
    const { result, rerender } = renderHook(({ id }) => useForumMessages(id), {
      initialProps: { id: 'nasa' },
    });
    rerender({ id: 'esports-tribunal' });
    rerender({ id: 'notNasa' });
    const [nasa, esports, notNasa] = stub.gets();

    await act(async () => notNasa.respond(200, notNasaMsgs));
    await act(async () => esports.respond(200, esportsMsgs));
    await act(async () => nasa.respond(200, nasaMsgs));

    expect(result.current.data).toEqual(notNasaMsgs);
    expect(result.current.loading).toBe(false);
  });

  it('a stale network error after switching does not set error on the new channel', async () => {
    useStub({ rejectOnAbort: false });
    const { result, rerender } = renderHook(({ id }) => useForumMessages(id), {
      initialProps: { id: 'nasa' },
    });
    rerender({ id: 'notNasa' });
    const [nasa, notNasa] = stub.gets();

    await act(async () => notNasa.respond(200, notNasaMsgs));
    await act(async () => nasa.fail());
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(notNasaMsgs);
  });

  it('never shows the previous channel\'s data while the new one is loading', async () => {
    useStub();
    const { result, rerender } = renderHook(({ id }) => useForumMessages(id), {
      initialProps: { id: 'nasa' },
    });
    await act(async () => stub.lastGet().respond(200, nasaMsgs));
    expect(result.current.data).toEqual(nasaMsgs);

    rerender({ id: 'esports-tribunal' });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('exposes an error (and stops loading) on HTTP failure', async () => {
    useStub();
    const { result } = renderHook(() => useForumMessages('nasa'));
    await act(async () => stub.lastGet().respond(500, { error: 'Internal server error' }));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Internal server error');
    expect(result.current.data).toEqual([]);
  });

  it('exposes an error on network failure', async () => {
    useStub();
    const { result } = renderHook(() => useForumMessages('nasa'));
    await act(async () => stub.lastGet().fail(new TypeError('Failed to fetch')));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch');
  });

  it('aborts the in-flight request on unmount', () => {
    useStub();
    const { unmount } = renderHook(() => useForumMessages('nasa'));
    unmount();
    expect(stub.lastGet().aborted).toBe(true);
  });

  it('URL-encodes the forum id', () => {
    useStub();
    renderHook(() => useForumMessages('a/b?c'));
    expect(stub.lastGet().url).toBe('/api/messages/a%2Fb%3Fc');
  });

  describe('postMessage', () => {
    it('POSTs JSON to the current forum, then refetches it', async () => {
      useStub();
      const { result } = renderHook(() => useForumMessages('nasa'));
      await act(async () => stub.lastGet().respond(200, nasaMsgs));

      let posting;
      act(() => {
        posting = result.current.postMessage({ author: 'me', text: 'hi' });
      });
      const post = stub.calls.find((c) => c.method === 'POST');
      expect(post.url).toBe('/api/messages/nasa');
      expect(post.init.headers).toMatchObject({ 'Content-Type': 'application/json' });
      expect(JSON.parse(post.init.body)).toEqual({ author: 'me', text: 'hi' });

      const created = { id: 'n2', text: 'hi', author: 'me', timestamp: '2026-11-16T10:05:00.000Z' };
      await act(async () => post.respond(201, created));
      await expect(posting).resolves.toEqual(created);

      await waitFor(() => expect(stub.gets()).toHaveLength(2));
      await act(async () => stub.lastGet().respond(200, [...nasaMsgs, created]));
      expect(result.current.data).toEqual([...nasaMsgs, created]);
    });

    it('keeps showing current data while the post-refetch is in flight', async () => {
      useStub();
      const { result } = renderHook(() => useForumMessages('nasa'));
      await act(async () => stub.lastGet().respond(200, nasaMsgs));

      let posting;
      act(() => {
        posting = result.current.postMessage({ author: 'me', text: 'hi' });
      });
      await act(async () => stub.calls.find((c) => c.method === 'POST').respond(201, { id: 'n2' }));
      await posting;
      expect(result.current.data).toEqual(nasaMsgs);
    });

    it('rejects with the server error message on 400 and does not refetch', async () => {
      useStub();
      const { result } = renderHook(() => useForumMessages('nasa'));
      await act(async () => stub.lastGet().respond(200, nasaMsgs));

      let rejection;
      act(() => {
        // Attach the assertion before the response arrives, or the rejection is briefly unhandled.
        rejection = expect(result.current.postMessage({ author: '', text: '' })).rejects.toThrow(
          'Missing required fields'
        );
      });
      await act(async () =>
        stub.calls.find((c) => c.method === 'POST').respond(400, { error: 'Missing required fields' })
      );
      await rejection;
      expect(stub.gets()).toHaveLength(1);
    });
  });
});
