import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { Select } from './Select';

export default {
  title: 'Components/Form/Select',
  args: {
    disabled: false,
  },
} as Meta;

interface Args {
  disabled?: boolean;
}

export function Example({ disabled }: Args) {
  const [value, setValue] = useState(0);
  const options = [
    { value: 1, label: 'one' },
    { value: 2, label: 'two' },
  ];
  return (
    <Select
      value={value}
      onChange={(e) => setValue(parseInt(e.target.value, 10))}
      disabled={disabled}
      options={options}
    />
  );
}

export const DisabledSelect: Story<Args> = Example.bind({});
DisabledSelect.args = {
  disabled: true,
};
