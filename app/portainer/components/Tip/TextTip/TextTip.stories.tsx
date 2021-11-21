import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { TextTip, Props } from './TextTip';

export default {
  component: TextTip,
  title: 'Components/Tip/TextTip',
} as Meta;

function Template({
  text,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return <TextTip text={text}>{children}</TextTip>;
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  text: 'Example tip',
};

export const WithChildren: Story<PropsWithChildren<Props>> = Template.bind({});
WithChildren.args = {
  children: 'This is a text tip with children',
};
