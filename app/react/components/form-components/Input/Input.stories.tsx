import { Meta, StoryFn } from '@storybook/react-webpack5';
import { useState } from 'react';

import { Input } from './Input';

export default {
  title: 'Components/Forms/Input',
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
      data-cy="docker-logging-options-input"
    />
  );
}

export const DisabledTextField: StoryFn<Args> = TextField.bind({});
DisabledTextField.args = {
  disabled: true,
};
