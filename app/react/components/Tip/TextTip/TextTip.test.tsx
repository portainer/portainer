import { render } from '@testing-library/react';

import { TextTip } from './TextTip';

test('should display a TextTip with children', async () => {
  const children = 'test text tip';
  const { findByText } = render(<TextTip>{children}</TextTip>);

  const heading = await findByText(children);
  expect(heading).toBeTruthy();
});
