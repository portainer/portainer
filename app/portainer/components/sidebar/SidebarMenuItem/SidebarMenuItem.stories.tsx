import { Meta, Story } from '@storybook/react';

import { SidebarMenuItem } from './SidebarMenuItem';

const meta: Meta = {
  title: 'Components/SidebarMenuItem',
  component: SidebarMenuItem,
};
export default meta;

interface StoryProps {
  iconClass: string;
  className: string;
  itemName: string;
  LinkName: string;
}

function Template({ iconClass, className, itemName, LinkName }: StoryProps) {
  return (
    <SidebarMenuItem
      path="example.path"
      pathParams={{ endpointId: 1 }}
      iconClass={iconClass}
      className={className}
      itemName={itemName}
    >
      {LinkName}
    </SidebarMenuItem>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  iconClass: 'fa-tachometer-alt fa-fw',
  className: 'exampleItemClass',
  itemName: 'ExampleItem',
  LinkName: 'Example Link Name',
};

export function WithoutLinkName() {
  return (
    <SidebarMenuItem
      path="example.path"
      pathParams={{ endpointId: 1 }}
      iconClass="fa-tachometer-alt fa-fw"
      className="exampleItemClass"
      itemName="ExampleItem"
    />
  );
}

export function WithoutIconOrLinkName() {
  return (
    <SidebarMenuItem
      path="example.path"
      pathParams={{ endpointId: 1 }}
      className="exampleItemClass"
      itemName="ExampleItem"
    />
  );
}
