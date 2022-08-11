import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';

import { TeamAssociationSelector } from './TeamAssociationSelector';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <TeamAssociationSelector users={[]} memberships={[]} teamId={3} />
    </UserContext.Provider>
  );
}
