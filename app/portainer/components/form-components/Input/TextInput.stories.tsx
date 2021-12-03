import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { TextInput } from './TextInput';

export default {
  title: 'Components/Form/TextInput',
  args: {
    disabled: false,
  },
} as Meta;

interface Args {
  disabled?: boolean;
}

export function TextField({ disabled }: Args) {
  const [value, setValue] = useState('');
  return <TextInput value={value} onChange={setValue} disabled={disabled} />;
}

export const DisabledTextField: Story<Args> = TextField.bind({});
DisabledTextField.args = {
  disabled: true,
};
