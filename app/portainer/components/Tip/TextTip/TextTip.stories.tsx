import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { TextTip } from './TextTip';

export default {
  component: TextTip,
  title: 'Components/Tip/TextTip',
} as Meta;

function Template({
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<unknown>) {
  return <TextTip>{children}</TextTip>;
}

export const Primary: Story<PropsWithChildren<unknown>> = Template.bind({});
Primary.args = {
  children: 'This is a text tip with children',
};
