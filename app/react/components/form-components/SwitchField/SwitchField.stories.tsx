import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { SwitchField } from './SwitchField';

export default {
  title: 'Components/Form/SwitchField',
} as Meta;

export function Example() {
  const [isChecked, setIsChecked] = useState(false);
  function onChange() {
    setIsChecked(!isChecked);
  }

  return (
    <SwitchField
      name="name"
      checked={isChecked}
      onChange={onChange}
      label="Example"
    />
  );
}

interface Args {
  checked: boolean;
  label: string;
  labelClass: string;
}

function Template({ checked, label, labelClass }: Args) {
  return (
    <SwitchField
      name="name"
      checked={checked}
      onChange={() => {}}
      label={label}
      labelClass={labelClass}
    />
  );
}

export const Checked: Story<Args> = Template.bind({});
Checked.args = {
  checked: true,
  label: 'label',
  labelClass: 'col-sm-6',
};

export const Unchecked: Story<Args> = Template.bind({});
Unchecked.args = {
  checked: false,
  label: 'label',
  labelClass: 'col-sm-6',
};
