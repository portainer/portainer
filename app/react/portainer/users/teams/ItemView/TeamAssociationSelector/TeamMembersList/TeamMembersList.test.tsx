import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render } from '@/react-tools/test-utils';

import { TeamMembersList } from './TeamMembersList';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return render(
    <UserContext.Provider value={{ user }}>
      <TeamMembersList users={[]} roles={{}} />
    </UserContext.Provider>
  );
}

test.todo('when users list is empty, add all users button is disabled');
test.todo('filter displays expected users');
