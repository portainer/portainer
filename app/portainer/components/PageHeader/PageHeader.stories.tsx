import { Meta, Story } from '@storybook/react';
import { useMemo } from 'react';

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
      <PageHeader
        title={title}
        breadcrumbs={[
          { link: 'example', label: 'bread1' },
          { link: 'example2', label: 'bread2' },
          { label: 'bread3' },
          { label: 'bread4' },
        ]}
      />
    </UserContext.Provider>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
