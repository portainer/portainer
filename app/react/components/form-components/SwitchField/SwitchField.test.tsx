import { render, fireEvent } from '@testing-library/react';

import { SwitchField, Props } from './SwitchField';

function renderDefault({
  name = 'default name',
  checked = false,
  label = 'label',
  onChange = vi.fn(),
  index,
}: Partial<Props> = {}) {
  return render(
    <SwitchField
      label={label}
      data-cy="switch-field"
      name={name}
      checked={checked}
      onChange={onChange}
      index={index}
    />
  );
}

test('should display a Switch component', async () => {
  const { findByRole } = renderDefault();

  const switchElem = await findByRole('checkbox');
  expect(switchElem).toBeTruthy();
});

test('clicking should emit on-change with the opposite value', async () => {
  const onChange = vi.fn();
  const checked = true;
  const { findByRole } = renderDefault({ onChange, checked });

  const switchElem = await findByRole('checkbox');
  fireEvent.click(switchElem);

  expect(onChange).toHaveBeenCalledWith(!checked, undefined);
});

test('clicking should emit on-change with the opposite value and index', async () => {
  const onChange = vi.fn();
  const checked = true;
  const index = 3;
  const { findByRole } = renderDefault({ onChange, checked, index });

  const switchElem = await findByRole('checkbox');
  fireEvent.click(switchElem);

  expect(onChange).toHaveBeenCalledWith(!checked, index);
});
