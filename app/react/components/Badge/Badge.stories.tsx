import { Meta } from '@storybook/react';

import { Badge, BadgeType, Props } from './Badge';

export default {
  component: Badge,
  title: 'Components/Badge',
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: [
          'success',
          'danger',
          'warn',
          'info',
          'successSecondary',
          'dangerSecondary',
          'warnSecondary',
          'infoSecondary',
        ],
      },
    },
  },
} as Meta<Props>;

// : JSX.IntrinsicAttributes & PropsWithChildren<Props>
function Template({ type = 'success' }: Props) {
  const message: Record<BadgeType, string> = {
    success: 'success badge',
    danger: 'danger badge',
    warn: 'warn badge',
    info: 'info badge',
    successSecondary: 'successSecondary badge',
    dangerSecondary: 'dangerSecondary badge',
    warnSecondary: 'warnSecondary badge',
    infoSecondary: 'infoSecondary badge',
  };
  return <Badge type={type}>{message[type]}</Badge>;
}

export const Example = Template.bind({});
