import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import {
  CustomTemplatesVariablesField,
  Values,
} from './CustomTemplatesVariablesField';

test('renders CustomTemplatesVariablesField component', () => {
  const onChange = vi.fn();
  const definitions = [
    {
      name: 'Variable1',
      label: 'Variable 1',
      description: 'Description 1',
      defaultValue: 'Default 1',
    },
    {
      name: 'Variable2',
      label: 'Variable 2',
      description: 'Description 2',
      defaultValue: 'Default 2',
    },
  ];
  const value: Values = [
    { key: 'Variable1', value: 'Value 1' },
    { key: 'Variable2', value: 'Value 2' },
  ];

  render(
    <CustomTemplatesVariablesField
      onChange={onChange}
      definitions={definitions}
      value={value}
    />
  );

  const variableFieldItems = screen.getAllByLabelText(/Variable \d/);
  expect(variableFieldItems).toHaveLength(2);
});

test('calls onChange when variable value is changed', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const definitions = [
    {
      name: 'Variable1',
      label: 'Variable 1',
      description: 'Description 1',
      defaultValue: 'Default 1',
    },
  ];
  const value: Values = [{ key: 'Variable1', value: 'Value 1' }];

  render(
    <CustomTemplatesVariablesField
      onChange={onChange}
      definitions={definitions}
      value={value}
    />
  );

  const inputElement = screen.getByLabelText('Variable 1');

  await user.clear(inputElement);
  expect(onChange).toHaveBeenCalledWith([{ key: 'Variable1', value: '' }]);

  await user.type(inputElement, 'New Value');
  expect(onChange).toHaveBeenCalled();
});

test('renders error message when errors prop is provided', () => {
  const onChange = vi.fn();
  const definitions = [
    {
      name: 'Variable1',
      label: 'Variable 1',
      description: 'Description 1',
      defaultValue: 'Default 1',
    },
  ];
  const value: Values = [{ key: 'Variable1', value: 'Value 1' }];
  const errors = [{ value: 'Error message' }];

  render(
    <CustomTemplatesVariablesField
      onChange={onChange}
      definitions={definitions}
      value={value}
      errors={errors}
    />
  );

  const errorElement = screen.getByText('Error message');
  expect(errorElement).toBeInTheDocument();
});
