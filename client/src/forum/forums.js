// Must match server/src/forums.js (the server answers 404 for anything else).
export const FORUMS = ['nasa', 'esports-tribunal', 'notNasa'];

export const isForum = (name) => FORUMS.includes(name);
