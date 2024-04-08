import type { Meta, StoryObj } from '@storybook/react';

import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { ServiceWidget } from './ServiceWidget';

const Wrapped = withUserProvider(ServiceWidget);

const meta: Meta<typeof ServiceWidget> = {
  component: ServiceWidget,
  render: (args) => <Wrapped {...args} />,
  args: {
    titleIcon: 'icon-name',
    title: 'Service Widget',
    onAdd: () => {},
    hasChanges: false,
    onReset: () => {},
    onSubmit: () => {},
    labelForAddButton: 'Add',
    isValid: true,
    children: <div className="p-5">This service has no ports published.</div>,
  },
};

export default meta;

type Story = StoryObj<typeof ServiceWidget>;

export const Default: Story = {};
