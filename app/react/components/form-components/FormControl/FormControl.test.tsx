import { render } from '@testing-library/react';

import { FormControl, Props } from './FormControl';

function renderDefault({
  inputId = 'id',
  label,
  tooltip = '',

  errors,
}: Partial<Props>) {
  return render(
    <FormControl
      inputId={inputId}
      label={label}
      tooltip={tooltip}
      errors={errors}
    >
      <input />
    </FormControl>
  );
}

test('should display a Input component', async () => {
  const label = 'test label';
  const { findByText } = renderDefault({ label });

  const inputElem = await findByText(label);
  expect(inputElem).toBeTruthy();
});
