import { fireEvent, render } from '@testing-library/react';

import { CopyButton } from './CopyButton';

test('should display a CopyButton with children', async () => {
  const children = 'test button children';
  const { findByText } = render(
    <CopyButton copyText="">{children}</CopyButton>
  );

  const button = await findByText(children);
  expect(button).toBeTruthy();
});

test('should display a CopyButton with label prop', async () => {
  const label = 'something new';
  const { findByText } = render(<CopyButton copyText="" label={label} />);

  const button = await findByText(label);
  expect(button).toBeTruthy();
});

test('CopyButton should copy text to clipboard', async () => {
  // override navigator.clipboard.writeText (to test copy to clipboard functionality)
  let clipboardText = '';
  Object.assign(navigator, {
    clipboard: {
      writeText: (text: string) => {
        clipboardText = text;
      },
    },
  });

  const children = 'button';
  const copyText = 'text successfully copied to clipboard';
  const { findByText } = render(
    <CopyButton copyText={copyText}>{children}</CopyButton>
  );

  const button = await findByText(children);
  expect(button).toBeTruthy();

  fireEvent.click(button);
  expect(clipboardText).toBe(copyText);
});
