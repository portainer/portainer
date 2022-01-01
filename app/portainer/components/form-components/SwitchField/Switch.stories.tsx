import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { Switch } from './Switch';

export default {
  title: 'Components/Form/SwitchField/Switch',
} as Meta;

export function Example() {
  const [isChecked, setIsChecked] = useState(false);
  function onChange() {
    setIsChecked(!isChecked);
  }

  return <Switch name="name" checked={isChecked} onChange={onChange} id="id" />;
}

interface Args {
  checked: boolean;
}

function Template({ checked }: Args) {
  return <Switch name="name" checked={checked} onChange={() => {}} id="id" />;
}

export const Checked: Story<Args> = Template.bind({});
Checked.args = {
  checked: true,
};

export const Unchecked: Story<Args> = Template.bind({});
Unchecked.args = {
  checked: false,
};
