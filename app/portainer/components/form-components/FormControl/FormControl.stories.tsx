import { Meta } from '@storybook/react';
import { useState } from 'react';

import { FormControl } from './FormControl';

export default {
  title: 'Components/Form/Control',
} as Meta;

interface TextFieldProps {
  label: string;
  tooltip?: string;
}

export function TextField({ label, tooltip = '' }: TextFieldProps) {
  const [value, setValue] = useState('');
  const inputId = 'input';
  return (
    <FormControl inputId={inputId} label={label} tooltip={tooltip}>
      <input
        id={inputId}
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </FormControl>
  );
}

TextField.args = {
  label: 'label',
  tooltip: '',
};

export function Select({ label, tooltip = '' }: TextFieldProps) {
  const options = [
    { value: 1, label: 'one' },
    { value: 2, label: 'two' },
  ];
  const [value, setValue] = useState('');
  const inputId = 'input';
  return (
    <FormControl inputId={inputId} label={label} tooltip={tooltip}>
      <select
        className="form-control"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {options.map((item) => (
          <option value={item.value}>{item.label}</option>
        ))}
      </select>
    </FormControl>
  );
}

Select.args = {
  label: 'select',
  tooltip: '',
};
