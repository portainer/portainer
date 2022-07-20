import { render, fireEvent } from '@/react-tools/test-utils';

import { SwitchField, Props } from './SwitchField';

function renderDefault({
  name = 'default name',
  checked = false,
  label = 'label',
  onChange = jest.fn(),
}: Partial<Props> = {}) {
  return render(
    <SwitchField
      label={label}
      name={name}
      checked={checked}
      onChange={onChange}
    />
  );
}

test('should display a Switch component', async () => {
  const { findByRole } = renderDefault();

  const switchElem = await findByRole('checkbox');
  expect(switchElem).toBeTruthy();
});

test('clicking should emit on-change with the opposite value', async () => {
  const onChange = jest.fn();
  const checked = true;
  const { findByRole } = renderDefault({ onChange, checked });

  const switchElem = await findByRole('checkbox');
  fireEvent.click(switchElem);

  expect(onChange).toHaveBeenCalledWith(!checked);
});
