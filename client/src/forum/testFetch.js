// Test helper (not shipped): a controllable fetch stub.
// Each call stays pending until the test calls respond()/fail() on it, so tests decide
// the order responses arrive in — including after the request was aborted.
export function createFetchStub({ rejectOnAbort = true } = {}) {
  const calls = [];

  const fetch = vi.fn((url, init = {}) => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const call = {
      url,
      init,
      method: init.method ?? 'GET',
      get aborted() {
        return Boolean(init.signal?.aborted);
      },
      respond(status, body) {
        resolve({ ok: status >= 200 && status < 300, status, json: async () => body });
      },
      fail(error = new TypeError('Failed to fetch')) {
        reject(error);
      },
    };

    // Real fetch rejects with an AbortError as soon as its signal aborts.
    if (rejectOnAbort && init.signal) {
      init.signal.addEventListener('abort', () =>
        reject(new DOMException('The operation was aborted.', 'AbortError'))
      );
    }

    calls.push(call);
    return promise;
  });

  const gets = () => calls.filter((c) => c.method === 'GET');
  const lastGet = () => gets().at(-1);

  return { fetch, calls, gets, lastGet };
}
