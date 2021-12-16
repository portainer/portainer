import { Meta, Story } from '@storybook/react';
import { useMemo } from 'react';

import { Link } from '@/portainer/components/Link';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs';

import { HeaderContent, HeaderTitle } from '.';

export default {
  component: Header,
  title: 'Components/Header',
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
      <Header>
        <HeaderTitle title={title} />
        <HeaderContent>
          <Breadcrumbs>
            <Link to="example">Container instances</Link>
            Add container
          </Breadcrumbs>
        </HeaderContent>
      </Header>
    </UserContext.Provider>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
