import { useCallback, useEffect, useState } from 'react';

const messagesUrl = (forumId) => `/api/messages/${encodeURIComponent(forumId)}`;

// Server errors are JSON { error }; fall back to the status code if the body is not JSON.
async function readError(res) {
  try {
    const body = await res.json();
    return body?.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Messages of one forum (slide 26 contract): { data, loading, error, postMessage }.
 *
 * The fetch result is stored together with the forumId/reloadKey it belongs to, and
 * `loading` / `data` are derived in render. So switching channels never shows the old
 * channel's messages, and no setState is needed at the start of the effect.
 */
export const useForumMessages = (forumId) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ forumId: null, reloadKey: -1, data: [], error: null });

  useEffect(() => {
    const controller = new AbortController(); // AbortController instantiation inside useEffect

    const fetchMessages = async () => {
      try {
        const res = await fetch(messagesUrl(forumId), { signal: controller.signal });
        if (!res.ok) throw new Error(await readError(res));
        const data = await res.json();
        // signal.aborted guard: a response for an older channel must not overwrite the newer one.
        if (!controller.signal.aborted) {
          setResult({ forumId, reloadKey, data, error: null });
        }
      } catch (err) {
        // AbortError from our own cleanup is expected, not a failure.
        if (!controller.signal.aborted) {
          setResult({ forumId, reloadKey, data: [], error: err.message });
        }
      }
    };

    fetchMessages();
    return () => controller.abort(); // cleanup: cancel the in-flight request
  }, [forumId, reloadKey]);

  const postMessage = useCallback(
    async (payload) => {
      const res = await fetch(messagesUrl(forumId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      const created = await res.json();
      setReloadKey((k) => k + 1); // trigger refetch of the current forum
      return created;
    },
    [forumId]
  );

  const isCurrentForum = result.forumId === forumId;
  return {
    data: isCurrentForum ? result.data : [],
    loading: !isCurrentForum || result.reloadKey !== reloadKey,
    error: isCurrentForum ? result.error : null,
    postMessage,
  };
};
