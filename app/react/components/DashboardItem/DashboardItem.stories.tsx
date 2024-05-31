import { Meta, Story } from '@storybook/react';
import { List } from 'lucide-react';

import { Link } from '@@/Link';
import { IconProps } from '@@/Icon';

import { DashboardItem } from './DashboardItem';

const meta: Meta = {
  title: 'Components/DashboardItem',
  component: DashboardItem,
};
export default meta;

interface StoryProps {
  value: number;
  icon: IconProps['icon'];
  type: string;
}

function Template({ value, icon, type }: StoryProps) {
  return (
    <DashboardItem
      value={value}
      icon={icon}
      type={type}
      data-cy="data-cy-example"
    />
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  value: 1,
  icon: List,
  type: 'Example resource',
};

export function WithLink() {
  return (
    <Link to="example.page" data-cy="data-cy-example">
      <DashboardItem
        value={1}
        icon={List}
        type="Example resource"
        data-cy="data-cy-example"
      />
    </Link>
  );
}

export function WithChildren() {
  return (
    <DashboardItem
      value={1}
      icon={List}
      type="Example resource"
      data-cy="data-cy-example"
    >
      <div>Children</div>
    </DashboardItem>
  );
}
