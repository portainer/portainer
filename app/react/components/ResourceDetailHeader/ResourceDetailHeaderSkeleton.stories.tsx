import { Meta, StoryObj } from '@storybook/react-webpack5';

import { ResourceDetailHeaderSkeleton } from './ResourceDetailHeaderSkeleton';

export default {
  component: ResourceDetailHeaderSkeleton,
  title: 'Design System/ResourceDetailHeader/Skeleton',
} as Meta;

type Story = StoryObj<typeof ResourceDetailHeaderSkeleton>;

export const Default: Story = {};

export const WithStatBlocks: Story = {
  args: { statBlockCount: 2 },
};

export const WithActionBar: Story = {
  args: { hasActionBar: true },
};

export const Full: Story = {
  args: { statBlockCount: 2, hasActionBar: true },
};
