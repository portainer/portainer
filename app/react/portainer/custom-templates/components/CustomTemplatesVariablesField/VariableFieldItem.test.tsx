import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import { VariableFieldItem } from './VariableFieldItem';

test('renders VariableFieldItem component', () => {
  const definition = {
    name: 'variableName',
    label: 'Variable Label',
    description: 'Variable Description',
    defaultValue: 'Default Value',
  };

  render(<VariableFieldItem definition={definition} onChange={vi.fn()} />);

  const labelElement = screen.getByText('Variable Label');
  expect(labelElement).toBeInTheDocument();

  const inputElement = screen.getByPlaceholderText(
    'Enter value or leave blank to use default of Default Value'
  );
  expect(inputElement).toBeInTheDocument();
});

test('calls onChange when input value changes', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  const definition = {
    name: 'variableName',
    label: 'Variable Label',
    description: 'Variable Description',
    defaultValue: 'Default Value',
  };

  render(
    <VariableFieldItem
      definition={definition}
      onChange={onChange}
      value="value"
    />
  );

  const inputElement = screen.getByLabelText(definition.label);

  await user.clear(inputElement);
  expect(onChange).toHaveBeenCalledWith('');

  await user.type(inputElement, 'New Value');
  expect(onChange).toHaveBeenCalled();
});
