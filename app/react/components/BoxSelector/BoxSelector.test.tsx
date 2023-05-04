import { Rocket } from 'lucide-react';

import { render, fireEvent } from '@/react-tools/test-utils';

import { BoxSelector } from './BoxSelector';
import { BoxSelectorOption, Value } from './types';

function renderDefault<T extends Value>({
  options = [],
  onChange = () => {},
  radioName = 'radio',
  value,
}: {
  options?: BoxSelectorOption<T>[];
  onChange?: (value: T) => void;
  radioName?: string;
  value: T;
}) {
  return render(
    <BoxSelector
      options={options}
      onChange={onChange}
      radioName={radioName}
      value={value}
    />
  );
}

test('should render with the initial value selected and call onChange when clicking a different value', async () => {
  const options: BoxSelectorOption<number>[] = [
    {
      description: 'description 1',
      icon: Rocket,
      id: '1',
      value: 3,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: Rocket,
      id: '2',
      value: 4,
      label: 'option 2',
    },
  ];

  const onChange = jest.fn();
  const { getByLabelText } = renderDefault({
    options,
    onChange,
    value: options[0].value,
  });

  const item1 = getByLabelText(options[0].label, {
    exact: false,
  }) as HTMLInputElement;
  expect(item1.checked).toBeTruthy();

  const item2 = getByLabelText(options[1].label, {
    exact: false,
  }) as HTMLInputElement;
  expect(item2.checked).toBeFalsy();

  fireEvent.click(item2);
  expect(onChange).toHaveBeenCalledWith(options[1].value, false);
});
