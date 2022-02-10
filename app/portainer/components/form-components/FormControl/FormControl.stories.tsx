import { Meta } from '@storybook/react';
import { useState } from 'react';

import { Input, Select } from '../Input';

import { FormControl } from './FormControl';

export default {
  title: 'Components/Form/Control',
} as Meta;

interface TextFieldProps {
  label: string;
  tooltip?: string;
}

export { TextField, SelectField };

function TextField({ label, tooltip = '' }: TextFieldProps) {
  const [value, setValue] = useState('');
  const inputId = 'input';
  return (
    <FormControl inputId={inputId} label={label} tooltip={tooltip}>
      <Input
        id={inputId}
        type="text"
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

function SelectField({ label, tooltip = '' }: TextFieldProps) {
  const options = [
    { value: 1, label: 'one' },
    { value: 2, label: 'two' },
  ];
  const [value, setValue] = useState(0);
  const inputId = 'input';
  return (
    <FormControl inputId={inputId} label={label} tooltip={tooltip}>
      <Select
        className="form-control"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        options={options}
      />
    </FormControl>
  );
}

SelectField.args = {
  label: 'select',
  tooltip: '',
};
