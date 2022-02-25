import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { Input } from './Input';

export default {
  title: 'Components/Form/Input',
  args: {
    disabled: false,
  },
} as Meta;

interface Args {
  disabled?: boolean;
}

export function TextField({ disabled }: Args) {
  const [value, setValue] = useState('');
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      disabled={disabled}
    />
  );
}

export const DisabledTextField: Story<Args> = TextField.bind({});
DisabledTextField.args = {
  disabled: true,
};
