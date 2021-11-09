import { render } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { ButtonGroup, Props } from './ButtonGroup';

function renderDefault({
  size = 'small',
  children = 'null',
}: Partial<PropsWithChildren<Props>> = {}) {
  return render(<ButtonGroup size={size}>{children}</ButtonGroup>);
}

test('should display a ButtonGroup component', async () => {
  const { findByRole } = renderDefault({});

  const element = await findByRole('group');
  expect(element).toBeTruthy();
});
