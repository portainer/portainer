import { render } from '@testing-library/react';

import { Code } from './Code';

test('should display a Code with children', async () => {
  const children = 'test text code component';
  const { findByText } = render(<Code>{children}</Code>);

  const heading = await findByText(children);
  expect(heading).toBeTruthy();
});
