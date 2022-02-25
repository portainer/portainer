import { render } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { Switch, Props } from './Switch';

function renderDefault({
  name = 'default name',
  checked = false,
}: Partial<PropsWithChildren<Props>> = {}) {
  return render(
    <Switch id="id" name={name} checked={checked} onChange={() => {}} />
  );
}

test('should display a Switch component', async () => {
  const { findByRole } = renderDefault();

  const switchElem = await findByRole('checkbox');
  expect(switchElem).toBeTruthy();
});
