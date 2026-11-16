import { render } from '@testing-library/react';
import PersonDetailSkeleton from './PersonDetailSkeleton.jsx';

describe('PersonDetailSkeleton', () => {
  it('announces loading with aria-busy="true" and aria-live="polite"', () => {
    const { container } = render(<PersonDetailSkeleton />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('mirrors the detail <dl> layout (2 rows) so swapping in content causes no layout shift', () => {
    const { container } = render(<PersonDetailSkeleton />);
    const root = container.firstElementChild;
    expect(root).toHaveClass('person-details');
    expect(root.querySelectorAll('.skeleton-row')).toHaveLength(2);
  });
});
