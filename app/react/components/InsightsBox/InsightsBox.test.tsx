import { render } from '@testing-library/react';

import { InsightsBox } from './InsightsBox';

test('should display a InsightsBox with a header and content', async () => {
  const header = 'test header';
  const content = 'test content';
  const { findByText } = render(
    <InsightsBox header={header} content={content} />
  );

  const headerFound = await findByText(header);
  expect(headerFound).toBeTruthy();
  const contentFound = await findByText(content);
  expect(contentFound).toBeTruthy();
});
