import { Meta, Story } from '@storybook/react';

import { SidebarItem } from '.';

const meta: Meta = {
  title: 'Sidebar/SidebarItem',
  component: SidebarItem,
};
export default meta;

interface StoryProps {
  iconClass?: string;
  className: string;
  label: string;
}

function Template({ iconClass, className, label: linkName }: StoryProps) {
  return (
    <ul className="sidebar">
      <SidebarItem.Wrapper className={className}>
        <SidebarItem.Link to="example.path" params={{ endpointId: 1 }}>
          {linkName}
          {iconClass && <SidebarItem.Icon iconClass={iconClass} />}
        </SidebarItem.Link>
      </SidebarItem.Wrapper>
    </ul>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  iconClass: 'fa-tachometer-alt fa-fw',
  className: 'exampleItemClass',
  label: 'Item with icon',
};

export const WithoutIcon: Story<StoryProps> = Template.bind({});
WithoutIcon.args = {
  className: 'exampleItemClass',
  label: 'Item without icon',
};
