import { render } from '@testing-library/react';

import { PageTitle } from './PageTitle';

test('should display the title text', () => {
  const title = 'Dashboard';

  const { getByText } = render(<PageTitle title={title} />);

  expect(getByText(title)).toBeVisible();
});

test('should render the title as an h1 element', () => {
  const title = 'Settings';

  const { getByRole } = render(<PageTitle title={title} />);

  const heading = getByRole('heading', { level: 1 });
  expect(heading).toHaveTextContent(title);
});

test('should render children alongside the title', () => {
  const title = 'Containers';
  const childText = 'extra content';

  const { getByText } = render(
    <PageTitle title={title}>
      <span>{childText}</span>
    </PageTitle>
  );

  expect(getByText(title)).toBeVisible();
  expect(getByText(childText)).toBeVisible();
});

test('should have the page-title data-cy attribute', () => {
  const { getByText } = render(<PageTitle title="Test" />);

  expect(getByText('Test')).toHaveAttribute('data-cy', 'page-title');
});
