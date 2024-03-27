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
  vertical?: boolean;
  required?: boolean;
  error?: string;
}

export { TextField, SelectField };

function TextField({
  label,
  tooltip = '',
  required,
  error,
  vertical,
}: TextFieldProps) {
  const [value, setValue] = useState('');
  const inputId = 'input';
  return (
    <FormControl
      inputId={inputId}
      label={label}
      tooltip={tooltip}
      required={required}
      errors={error}
      size={vertical ? 'vertical' : undefined}
    >
      <Input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        data-cy="input"
      />
    </FormControl>
  );
}

TextField.args = {
  label: 'label',
  tooltip: '',
  vertical: false,
  required: false,
  error: '',
};

function SelectField({
  label,
  tooltip = '',
  vertical,
  required,
  error,
}: TextFieldProps) {
  const options = [
    { value: 1, label: 'one' },
    { value: 2, label: 'two' },
  ];
  const [value, setValue] = useState(0);
  const inputId = 'input';
  return (
    <FormControl
      inputId={inputId}
      label={label}
      tooltip={tooltip}
      size={vertical ? 'vertical' : undefined}
      required={required}
      errors={error}
    >
      <Select
        className="form-control"
        data-cy="select"
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
  vertical: false,
  required: false,
  error: '',
};
