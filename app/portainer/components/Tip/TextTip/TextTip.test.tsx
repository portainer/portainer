import { render } from '@testing-library/react';

import { TextTip } from './TextTip';

test('should display a TextTip with children', async () => {
  const children = 'test text tip';
  const { findByText } = render(<TextTip>{children}</TextTip>);

  const heading = await findByText(children);
  expect(heading).toBeTruthy();
});

test('should display a TextTip with text prop', async () => {
  const text = 'text tip testing 2';
  const { findByText } = render(<TextTip text={text} />);

  const heading = await findByText(text);
  expect(heading).toBeTruthy();
});
