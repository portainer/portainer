import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { localizeDate } from '@/react/common/date-utils';

import { Badge } from '@@/Badge';

import { BlocklistItem } from './BlocklistItem';

const meta: Meta<typeof BlocklistItem> = {
  title: 'Components/Blocklist/BlocklistItem',
  component: BlocklistItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="blocklist">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BlocklistItem>;

export const Default: Story = {
  args: {
    children: 'Default Blocklist Item',
  },
};

export const Selected: Story = {
  args: {
    children: 'Selected Blocklist Item',
    isSelected: true,
  },
};

export const AsDiv: Story = {
  args: {
    children: 'Blocklist Item as div',
    as: 'div',
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap justify-between gap-1">
          <Badge type="success">Deployed</Badge>
          <span className="text-muted text-xs">Revision #4</span>
        </div>
        <div className="flex flex-wrap justify-between gap-1">
          <span className="text-muted text-xs">my-app-1.0.0</span>
          <span className="text-muted text-xs">
            {localizeDate(new Date('2000-01-01'))}
          </span>
        </div>
      </div>
    ),
  },
};

export const MultipleItems: Story = {
  render: () => (
    <div className="blocklist">
      <BlocklistItem>First Item</BlocklistItem>
      <BlocklistItem isSelected>Second Item (Selected)</BlocklistItem>
      <BlocklistItem>Third Item</BlocklistItem>
    </div>
  ),
};
