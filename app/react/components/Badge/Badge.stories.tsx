import { Meta } from '@storybook/react';

import { Badge, Props } from './Badge';

export default {
  component: Badge,
  title: 'Components/Badge',
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['success', 'danger', 'warn', 'info'],
      },
    },
  },
} as Meta<Props>;

// : JSX.IntrinsicAttributes & PropsWithChildren<Props>
function Template({ type = 'success' }: Props) {
  const message = {
    success: 'success badge',
    danger: 'danger badge',
    warn: 'warn badge',
    info: 'info badge',
  };
  return <Badge type={type}>{message[type]}</Badge>;
}

export const Example = Template.bind({});
