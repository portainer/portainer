import { fireEvent, render } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { Button, Props } from './Button';

function renderDefault({
  type = 'button',
  color = 'primary',
  size = 'small',
  disabled = false,
  onClick = () => {},
  children = null,
}: Partial<PropsWithChildren<Props>> = {}) {
  return render(
    <Button
      type={type}
      color={color}
      size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

test('should display a Button component and allow onClick', async () => {
  const children = 'test label';
  const onClick = jest.fn();
  const { findByText } = renderDefault({ children, onClick });

  const buttonLabel = await findByText(children);
  expect(buttonLabel).toBeTruthy();

  fireEvent.click(buttonLabel);
  expect(onClick).toHaveBeenCalled();
});
