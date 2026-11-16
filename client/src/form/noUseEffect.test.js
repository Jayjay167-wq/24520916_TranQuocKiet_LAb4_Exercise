import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Contract (slide 13–15): the form engine derives state in render; no useEffect anywhere in src/form.
const formDir = resolve(process.cwd(), 'src/form');

// Comments are stripped first so prose like "no useEffect here" is not flagged.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('form folder', () => {
  it('contains no useEffect in source files', () => {
    const offenders = readdirSync(formDir)
      .filter((f) => /\.(js|jsx)$/.test(f) && !/\.test\.(js|jsx)$/.test(f))
      .filter((f) => /\buseEffect\b/.test(stripComments(readFileSync(join(formDir, f), 'utf8'))));
    expect(offenders).toEqual([]);
  });

  it('would flag a real useEffect call (guard self-check)', () => {
    expect(/\buseEffect\b/.test(stripComments('// useEffect\nuseEffect(() => {}, []);'))).toBe(true);
    expect(/\buseEffect\b/.test(stripComments('/* no useEffect */ const x = 1; // useEffect'))).toBe(false);
  });
});
