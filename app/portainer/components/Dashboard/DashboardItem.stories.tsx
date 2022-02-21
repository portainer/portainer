import { Meta, Story } from '@storybook/react';

import { Link } from '@/portainer/components/Link';

import { DashboardItem } from './DashboardItem';

const meta: Meta = {
  title: 'Components/DashboardItem',
  component: DashboardItem,
};
export default meta;

interface StoryProps {
  value: number;
  icon: string;
  comment: string;
  accessibilityLabel: string;
}

function Template({ value, icon, comment, accessibilityLabel }: StoryProps) {
  return (
    <DashboardItem
      value={value}
      icon={icon}
      comment={comment}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  value: 1,
  icon: 'fa fa-th-list',
  comment: 'Resource',
  accessibilityLabel: 'dashboardItem',
};

export function WithLink() {
  return (
    <Link to="example.page">
      <DashboardItem
        value={1}
        icon="fa fa-th-list"
        comment="Resource"
        accessibilityLabel="dashboardItem"
      />
    </Link>
  );
}
