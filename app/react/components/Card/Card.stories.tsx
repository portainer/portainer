import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Card, Props } from './Card';

export default {
  component: Card,
  title: 'Components/Card/Card',
} as Meta;

function Template({
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return <Card>{children}</Card>;
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {};
