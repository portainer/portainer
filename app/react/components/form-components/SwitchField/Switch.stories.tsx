import { Meta, StoryFn } from '@storybook/react-webpack5';
import { useState } from 'react';

import { Switch } from './Switch';

export default {
  title: 'Components/Forms/SwitchField/Switch',
} as Meta;

export function Example() {
  const [isChecked, setIsChecked] = useState(false);
  function onChange() {
    setIsChecked(!isChecked);
  }

  return (
    <Switch
      name="name"
      data-cy="switch"
      checked={isChecked}
      onChange={onChange}
      id="id"
    />
  );
}

interface Args {
  checked: boolean;
}

function Template({ checked }: Args) {
  return (
    <Switch
      name="name"
      data-cy="switch"
      checked={checked}
      onChange={() => {}}
      id="id"
    />
  );
}

export const Checked: StoryFn<Args> = Template.bind({});
Checked.args = {
  checked: true,
};

export const Unchecked: StoryFn<Args> = Template.bind({});
Unchecked.args = {
  checked: false,
};
