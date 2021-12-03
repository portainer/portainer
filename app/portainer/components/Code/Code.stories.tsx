import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Code } from './Code';

export default {
  component: Code,
  title: 'Components/Code',
} as Meta;

function Template({
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<unknown>) {
  return <Code>{children}</Code>;
}

export const Primary: Story<PropsWithChildren<unknown>> = Template.bind({});
Primary.args = {
  children: 'curl -X GET http://ultra-sound-money.eth',
};

export const MultiLineWithChildren: Story<PropsWithChildren<
  unknown
>> = Template.bind({});
MultiLineWithChildren.args = {
  children: 'curl -X\n GET http://example-with-children.crypto',
};
