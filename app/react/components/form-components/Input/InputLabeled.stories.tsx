import { Meta } from '@storybook/react';
import { useState } from 'react';

import { InputLabeled } from './InputLabeled';

export default {
  component: InputLabeled,
  title: 'Components/Form/InputLabeled',
} as Meta;

export { TextInput, NumberInput };

function TextInput() {
  const [value, setValue] = useState('');

  return (
    <InputLabeled
      label="label"
      data-cy="input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function NumberInput() {
  const [value, setValue] = useState(5);

  return (
    <InputLabeled
      label="label"
      data-cy="input"
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.valueAsNumber)}
    />
  );
}
