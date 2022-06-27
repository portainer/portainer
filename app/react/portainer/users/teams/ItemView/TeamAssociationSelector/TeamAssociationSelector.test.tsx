import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render } from '@/react-tools/test-utils';

import { TeamAssociationSelector } from './TeamAssociationSelector';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return render(
    <UserContext.Provider value={{ user }}>
      <TeamAssociationSelector users={[]} memberships={[]} />
    </UserContext.Provider>
  );
}
