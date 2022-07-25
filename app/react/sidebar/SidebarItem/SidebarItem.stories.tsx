import { Meta, Story } from '@storybook/react';
import { Clock, Icon } from 'react-feather';

import { SidebarItem } from '.';

const meta: Meta = {
  title: 'Sidebar/SidebarItem',
  component: SidebarItem,
};
export default meta;

interface StoryProps {
  icon?: Icon;
  label: string;
}

function Template({ icon, label }: StoryProps) {
  return (
    <ul className="sidebar">
      <SidebarItem
        to="example.path"
        params={{ endpointId: 1 }}
        icon={icon}
        label={label}
      />
    </ul>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  icon: Clock,
  label: 'Item with icon',
};

export const WithoutIcon: Story<StoryProps> = Template.bind({});
WithoutIcon.args = {
  label: 'Item without icon',
};
