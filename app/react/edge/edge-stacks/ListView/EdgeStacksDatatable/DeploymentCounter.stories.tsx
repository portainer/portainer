import { StoryObj, Meta } from '@storybook/react';

import { StatusType } from '../../types';

import { DeploymentCounter } from './DeploymentCounter';

const meta: Meta<typeof DeploymentCounter> = {
  title: 'Edge/DeploymentCounter',
  component: DeploymentCounter,
};
export default meta;

type Story = StoryObj<typeof DeploymentCounter>;

export const Running: Story = {
  args: {
    count: 5,
    total: 10,
    type: StatusType.Running,
  },
};

export const Error: Story = {
  args: {
    count: 3,
    total: 10,
    type: StatusType.Error,
  },
};

export const Acknowledged: Story = {
  args: {
    count: 7,
    total: 10,
    type: StatusType.Acknowledged,
  },
};

export const ImagesPulled: Story = {
  args: {
    count: 9,
    total: 10,
    type: StatusType.ImagesPulled,
  },
};
