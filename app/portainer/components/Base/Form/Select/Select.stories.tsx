import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Select, Props } from './Select';

export default {
  component: Select,
  title: 'Components/Form/Select',
} as Meta;

function Template({
  name,
  options,
  selectedOption,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return (
    <Select name={name} options={options} selectedOption={selectedOption}>
      {children}
    </Select>
  );
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  name: 'My Select',
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
  children: 'Custom Select',
};
