import { FORUMS } from './forums.js';

/**
 * In-memory message store: data lives only as long as the process.
 * `seed` is an optional { [forum]: message[] } used at startup.
 */
export function createMessageStore(seed = {}) {
  const byForum = new Map(FORUMS.map((forum) => [forum, [...(seed[forum] ?? [])]]));

  return {
    // Returns a copy so callers can't mutate the store through the array.
    list(forum) {
      return [...(byForum.get(forum) ?? [])];
    },
    add(forum, message) {
      const messages = byForum.get(forum);
      if (!messages) throw new Error(`Unknown forum: ${forum}`);
      messages.push(message);
      return message;
    },
  };
}
