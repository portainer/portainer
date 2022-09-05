import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';

import { TeamMembersList } from './TeamMembersList';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <TeamMembersList users={[]} roles={{}} teamId={3} />
    </UserContext.Provider>
  );
}

test.todo('when users list is empty, add all users button is disabled');
test.todo('filter displays expected users');
