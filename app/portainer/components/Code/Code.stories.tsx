import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Code, Props } from './Code';

export default {
  component: Code,
  title: 'Components/Code',
} as Meta;

function Template({
  text,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return <Code text={text}>{children}</Code>;
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  text: 'curl -X GET http://ultra-sound-money.eth',
};

export const MultiLineWithChildren: Story<PropsWithChildren<
  Props
>> = Template.bind({});
MultiLineWithChildren.args = {
  children: 'curl -X\n GET http://example-with-children.crypto',
};
