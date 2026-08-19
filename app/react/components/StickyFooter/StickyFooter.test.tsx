import { render, screen } from '@testing-library/react';

import { StickyFooter } from './StickyFooter';

test('should render children', () => {
  render(
    <StickyFooter>
      <span>Content</span>
    </StickyFooter>
  );

  expect(screen.getByText('Content')).toBeInTheDocument();
});

test('should apply custom className', () => {
  const { container } = render(
    <StickyFooter className="custom-class">
      <span>Test</span>
    </StickyFooter>
  );

  expect(container.firstChild).toHaveClass('custom-class');
});

test('should render multiple children', () => {
  render(
    <StickyFooter>
      <button type="button">Cancel</button>
      <button type="button">Save</button>
    </StickyFooter>
  );

  expect(screen.getByText('Cancel')).toBeInTheDocument();
  expect(screen.getByText('Save')).toBeInTheDocument();
});
