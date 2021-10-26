import { Meta, Story } from '@storybook/react';

import { Link } from '@/portainer/components/Link';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { Header } from './Header';

import { HeaderContent, HeaderTitle } from '.';

export default {
  component: Header,
  title: 'Components/Header',
} as Meta;

interface StoryProps {
  title: string;
}

function Template({ title }: StoryProps) {
  return (
    <UserContext.Provider
      value={{ user: new UserViewModel({ Username: 'test' }) }}
    >
      <Header>
        <HeaderTitle title={title} />
        <HeaderContent>
          <Link to="example">Container instances</Link> {'> Add container'}
        </HeaderContent>
      </Header>
    </UserContext.Provider>
  );
}

export const Primary: Story<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
