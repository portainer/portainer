import { fireEvent, render } from '@testing-library/react';

import { AddButton, Props } from './AddButton';

function renderDefault({
  label = 'default label',
  onClick = () => {},
}: Partial<Props> = {}) {
  return render(<AddButton label={label} onClick={onClick} />);
}

test('should display a AddButton component and allow onClick', async () => {
  const label = 'test label';
  const onClick = jest.fn();
  const { findByText } = renderDefault({ label, onClick });

  const buttonLabel = await findByText(label);
  expect(buttonLabel).toBeTruthy();

  fireEvent.click(buttonLabel);
  expect(onClick).toHaveBeenCalled();
});
