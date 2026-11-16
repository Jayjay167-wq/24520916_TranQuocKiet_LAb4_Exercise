// The only forums the in-memory store knows about (project-rules §5).
export const FORUMS = Object.freeze(['nasa', 'esports-tribunal', 'notNasa']);

// Array#includes, not `name in obj`, so 'constructor' / '__proto__' are never forums.
export const isForum = (name) => FORUMS.includes(name);
