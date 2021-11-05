import { render } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { Select, Props } from './Select';

function renderDefault({
  name = 'default name',
  options = [],
  selectedOption = '1',
  customOnChange = () => {},
  children = null,
}: Partial<PropsWithChildren<Props>> = {}) {
  return render(
    <Select
      name={name}
      options={options}
      selectedOption={selectedOption}
      customOnChange={customOnChange}
    >
      {children}
    </Select>
  );
}

test('should display a Select component', async () => {
  const name = 'test select';
  const options = [
    {
      text: 'option 1',
      value: '1',
    },
    {
      text: 'option 2',
      value: '2',
    },
  ];
  const { findByText } = renderDefault({ name, options });

  const switchElem = await findByText('option 1');
  expect(switchElem).toBeTruthy();
});
