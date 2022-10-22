import { Meta } from '@storybook/react';

import { BadgeIcon, BadgeSize, Props } from './BadgeIcon';

export default {
  component: BadgeIcon,
  title: 'Components/BadgeIcon',
  argTypes: {
    size: {
      control: {
        type: 'select',
        options: ['md', 'lg', 'xl', '2xl', '3xl'],
      },
    },
    icon: {
      control: {
        type: 'select',
        options: ['edit', 'info', 'smile', 'users'],
      },
    },
  },
} as Meta<Props>;

// : JSX.IntrinsicAttributes & PropsWithChildren<Props>
function Template({
  size = '3xl',
  icon = 'edit',
}: {
  size?: BadgeSize;
  icon: string;
}) {
  return <BadgeIcon icon={icon} size={size} />;
}

export const Example = Template.bind({});
