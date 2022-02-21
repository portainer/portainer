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
}

function Template({ value, icon, comment }: StoryProps) {
  return <DashboardItem value={value} icon={icon} comment={comment} />;
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  value: 1,
  icon: 'fa fa-th-list',
  comment: 'Resource',
};

export function WithLink() {
  return (
    <Link to="example.page">
      <DashboardItem value={1} icon="fa fa-th-list" comment="Resource" />
    </Link>
  );
}
