import { Meta, Story } from '@storybook/react';
import { useMemo } from 'react';

import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { HeaderContainer } from './HeaderContainer';
import { Breadcrumbs } from './Breadcrumbs';
import { HeaderTitle } from './HeaderTitle';
import { HeaderContent } from './HeaderContent';

export default {
  component: HeaderContainer,
  title: 'Components/PageHeader/HeaderContainer',
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
      <HeaderContainer>
        <HeaderTitle title={title} />
        <HeaderContent>
          <Breadcrumbs
            breadcrumbs={[
              { link: 'example', label: 'crumb1' },
              { label: 'crumb2' },
            ]}
          />
        </HeaderContent>
      </HeaderContainer>
    </UserContext.Provider>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
