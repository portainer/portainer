import { render } from '@testing-library/react';

import { Heading } from './Heading';

test('should display a Heading with children', async () => {
  const children = 'test form heading';
  const { findByText } = render(<Heading>{children}</Heading>);

  const heading = await findByText(children);
  expect(heading).toBeTruthy();
});

test('should display a Heading with title prop', async () => {
  const title = 'something new';
  const { findByText } = render(<Heading title={title} />);

  const heading = await findByText(title);
  expect(heading).toBeTruthy();
});
