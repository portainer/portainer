import { Meta, Story } from '@storybook/react';
import { ChangeEvent, PropsWithChildren, useState } from 'react';

import { Select, Props } from './Select';

export default {
  component: Select,
  title: 'Components/Form/Select',
} as Meta;

function Template({
  name,
  options,
  value,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  const [selectValue, setSelectValue] = useState(value);
  function onChange(value: ChangeEvent<HTMLSelectElement>) {
    setSelectValue(value.target.value);
  }

  return (
    <Select
      name={name}
      options={options}
      value={selectValue}
      onChange={onChange}
    >
      {children}
    </Select>
  );
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  children: 'Custom Select',
  options: [
    {
      text: 'Option 1',
      value: '1',
    },
    {
      text: 'Option 2',
      value: '2',
    },
    {
      text: 'Option 3',
      value: '3',
    },
  ],
  name: 'my_select',
};
