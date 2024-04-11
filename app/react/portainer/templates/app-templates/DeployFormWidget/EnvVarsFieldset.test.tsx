import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import {
  EnvVarsFieldset,
  getDefaultValues,
  envVarsFieldsetValidation,
} from './EnvVarsFieldset';

test('renders EnvVarsFieldset component', () => {
  const onChange = vi.fn();
  const options = [
    { name: 'VAR1', label: 'Variable 1', preset: false },
    { name: 'VAR2', label: 'Variable 2', preset: false },
  ] as const;
  const value = { VAR1: 'Value 1', VAR2: 'Value 2' };

  render(
    <EnvVarsFieldset
      onChange={onChange}
      options={[...options]}
      values={value}
      errors={{}}
    />
  );

  options.forEach((option) => {
    const labelElement = screen.getByLabelText(option.label, { exact: false });
    expect(labelElement).toBeInTheDocument();

    const inputElement = screen.getByDisplayValue(value[option.name]);
    expect(inputElement).toBeInTheDocument();
  });
});

test('calls onChange when input value changes', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const options = [{ name: 'VAR1', label: 'Variable 1', preset: false }];
  const value = { VAR1: 'Value 1' };

  render(
    <EnvVarsFieldset
      onChange={onChange}
      options={options}
      values={value}
      errors={{}}
    />
  );

  const inputElement = screen.getByDisplayValue(value.VAR1);
  await user.clear(inputElement);
  expect(onChange).toHaveBeenCalledWith({ VAR1: '' });

  const newValue = 'New Value';
  await user.type(inputElement, newValue);
  expect(onChange).toHaveBeenCalled();
});

test('renders error message when there are errors', () => {
  const onChange = vi.fn();
  const options = [{ name: 'VAR1', label: 'Variable 1', preset: false }];
  const value = { VAR1: '' };

  render(
    <EnvVarsFieldset
      onChange={onChange}
      options={options}
      values={value}
      errors={{ VAR1: 'Required' }}
    />
  );

  const errorElement = screen.getByText('Required');
  expect(errorElement).toBeInTheDocument();
});

test('returns default values', () => {
  const definitions = [
    {
      name: 'VAR1',
      label: 'Variable 1',
      preset: false,
      default: 'Default Value 1',
    },
    {
      name: 'VAR2',
      label: 'Variable 2',
      preset: false,
      default: 'Default Value 2',
    },
  ];

  const defaultValues = getDefaultValues(definitions);

  expect(defaultValues).toEqual({
    VAR1: 'Default Value 1',
    VAR2: 'Default Value 2',
  });
});

test('validates env vars fieldset', () => {
  const schema = envVarsFieldsetValidation([
    { name: 'VAR1' },
    { name: 'VAR2' },
  ]);

  const validData = { VAR1: 'Value 1', VAR2: 'Value 2' };
  const invalidData = { VAR1: '', VAR2: 'Value 2' };

  const validResult = schema.isValidSync(validData);
  const invalidResult = schema.isValidSync(invalidData);

  expect(validResult).toBe(true);
  expect(invalidResult).toBe(false);
});
