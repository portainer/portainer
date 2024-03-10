import { render } from '@testing-library/react';

import { Badge } from './Badge';

test('should render a Badge component with default type', () => {
  const { getByText } = render(<Badge>Default Badge</Badge>);
  const badgeElement = getByText('Default Badge');
  expect(badgeElement).toBeInTheDocument();
  expect(badgeElement).toHaveClass('text-blue-9 bg-blue-2');
});

test('should render a Badge component with custom type', () => {
  const { getByText } = render(<Badge type="success">Success Badge</Badge>);
  const badgeElement = getByText('Success Badge');
  expect(badgeElement).toBeInTheDocument();
  expect(badgeElement).toHaveClass('text-success-9 bg-success-2');
});

test('should render a Badge component with custom className', () => {
  const { getByText } = render(
    <Badge className="custom-class">Custom Badge</Badge>
  );
  const badgeElement = getByText('Custom Badge');
  expect(badgeElement).toBeInTheDocument();
  expect(badgeElement).toHaveClass('custom-class');
});
