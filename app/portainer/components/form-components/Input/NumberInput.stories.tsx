import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { NumberInput } from './NumberInput';

export default {
  title: 'Components/Form/NumberInput',
  args: {
    disabled: false,
  },
} as Meta;

interface Args {
  disabled?: boolean;
}

export function Example({ disabled }: Args) {
  const [value, setValue] = useState(0);
  return <NumberInput value={value} onChange={setValue} disabled={disabled} />;
}

export const DisabledNumberInput: Story<Args> = Example.bind({});
DisabledNumberInput.args = {
  disabled: true,
};
