import { Meta, Story } from '@storybook/react';

import { SidebarMenuItem } from './SidebarMenuItem';

const meta: Meta = {
  title: 'Components/SidebarMenuItem',
  component: SidebarMenuItem,
};
export default meta;

interface StoryProps {
  iconClass?: string;
  className: string;
  itemName: string;
  linkName: string;
}

function Template({ iconClass, className, itemName, linkName }: StoryProps) {
  return (
    <ul className="sidebar">
      <div className="sidebar-list">
        <SidebarMenuItem
          path="example.path"
          pathParams={{ endpointId: 1 }}
          iconClass={iconClass}
          className={className}
          itemName={itemName}
        >
          {linkName}
        </SidebarMenuItem>
      </div>
    </ul>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  iconClass: 'fa-tachometer-alt fa-fw',
  className: 'exampleItemClass',
  itemName: 'ExampleItem',
  linkName: 'Item with icon',
};

export const WithoutIcon: Story<StoryProps> = Template.bind({});
WithoutIcon.args = {
  className: 'exampleItemClass',
  itemName: 'ExampleItem',
  linkName: 'Item without icon',
};
