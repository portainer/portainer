import { render } from '@testing-library/react';

import { FormSectionTitle } from './FormSectionTitle';

test('should display a FormSectionTitle with children', async () => {
  const children = 'test form title';
  const { findByText } = render(
    <FormSectionTitle>{children}</FormSectionTitle>
  );

  const heading = await findByText(children);
  expect(heading).toBeTruthy();
});
