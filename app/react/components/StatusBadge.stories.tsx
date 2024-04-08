import { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';

import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
};

export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const WithIcon: Story = {
  args: {
    icon: Check,
    children: 'With Icon',
  },
};

export const Success: Story = {
  args: {
    color: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    color: 'warning',
    children: 'Warning',
  },
};

export const Danger: Story = {
  args: {
    color: 'danger',
    children: 'Danger',
  },
};

export const WithAriaAttributes: Story = {
  args: {
    'aria-label': 'Badge with Aria Attributes',
    children: 'With Aria Attributes',
  },
};

export const WithChildren: Story = {
  args: {
    children: (
      <>
        <span role="img" aria-label="Star">
          ⭐️
        </span>
        With Children
      </>
    ),
  },
};
