import { Meta, Story } from '@storybook/react';

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
  link: string;
}

function Template({
  value,
  icon,
  comment,
  accessibilityLabel,
  link,
}: StoryProps) {
  return (
    <DashboardItem
      value={value}
      icon={icon}
      comment={comment}
      accessibilityLabel={accessibilityLabel}
      link={link}
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

export const WithLink: Story<StoryProps> = Template.bind({});
WithLink.args = {
  value: 1,
  icon: 'fa fa-th-list',
  comment: 'Resource',
  accessibilityLabel: 'dashboardItem',
  link: 'example.page',
};
