import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Heading, Props } from './Heading';

export default {
  component: Heading,
  title: 'Components/Form/Heading',
} as Meta;

function Template({
  title,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return <Heading title={title}>{children}</Heading>;
}

export const Example: Story<PropsWithChildren<Props>> = Template.bind({});
Example.args = {
  title: 'Example heading',
};

export const WithChildren: Story<PropsWithChildren<Props>> = Template.bind({});
WithChildren.args = {
  children: 'This is a heading with children',
};
