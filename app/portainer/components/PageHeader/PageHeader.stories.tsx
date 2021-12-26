import { Meta, Story } from '@storybook/react';
import { useMemo } from 'react';

import { Link } from '@/portainer/components/Link';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { PageHeader } from './PageHeader';

export default {
  component: PageHeader,
  title: 'Components/PageHeader',
} as Meta;

interface StoryProps {
  title: string;
}

function Template({ title }: StoryProps) {
  const state = useMemo(
    () => ({ user: new UserViewModel({ Username: 'test' }) }),
    []
  );

  return (
    <UserContext.Provider value={state}>
      <PageHeader title={title}>
        <Link to="example">bread1</Link>
        <Link to="example">bread2</Link>
        <span>bread3</span>
        bread4 and bread5
      </PageHeader>
    </UserContext.Provider>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
