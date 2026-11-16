import { randomUUID } from 'node:crypto';

const msg = (author, text, minutesAgo) => ({
  id: randomUUID(),
  text,
  author,
  timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
});

// Sample messages so each channel has content on first load (in-memory only).
export function createSeed() {
  return {
    nasa: [
      msg('mission-control', 'Artemis telemetry nominal.', 30),
      msg('astro_lin', 'Docking window opens in T-minus 12 minutes.', 5),
    ],
    'esports-tribunal': [
      msg('clerk', 'Tribunal is in session. Appeals are reviewed in order received.', 45),
      msg('Himass', 'Submitting fair-play appeal for match #42.', 10),
    ],
    notNasa: [
      msg('backyard_rockets', 'Definitely not a space agency. Just vibes and model rockets.', 20),
    ],
  };
}
