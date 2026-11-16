import { render, within } from '@testing-library/react';
import { ShowData } from './ShowData.jsx';

describe('ShowData – semantic <dl> inspector (slide 25)', () => {
  it('renders each key/value as div.data-row > dt + dd inside dl.json-inspector', () => {
    const { container } = render(
      <ShowData data={{ name: 'Ada', email: 'ada@example.com', age: 36 }} />
    );
    const dl = container.querySelector('dl.json-inspector');
    expect(dl).not.toBeNull();

    const rows = dl.querySelectorAll(':scope > div.data-row');
    expect(rows).toHaveLength(3);
    const pairs = [...rows].map((row) => [
      within(row).getByRole('term').textContent,
      within(row).getByRole('definition').textContent,
    ]);
    expect(pairs).toEqual([
      ['name', 'Ada'],
      ['email', 'ada@example.com'],
      ['age', '36'],
    ]);
  });

  it('stringifies non-string values with String(val), not JSON.stringify', () => {
    const { container } = render(<ShowData data={{ ok: true, none: null, n: 0 }} />);
    const defs = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(defs).toEqual(['true', 'null', '0']);
  });

  it('renders an empty <dl> for an empty object', () => {
    const { container } = render(<ShowData data={{}} />);
    expect(container.querySelector('dl.json-inspector').children).toHaveLength(0);
  });
});
