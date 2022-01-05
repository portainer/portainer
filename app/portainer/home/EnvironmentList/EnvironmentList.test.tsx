import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithClient } from '@/react-tools/test-utils';

import { EnvironmentList } from './EnvironmentList';

test('renders correctly', async () => {
  const user = new UserViewModel({ Username: 'test' });

  const { getByText } = renderWithClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentList
        homepageLoadTime={0}
        groups={[]}
        onClickItem={jest.fn()}
        tags={[]}
        onRefresh={jest.fn()}
      />
    </UserContext.Provider>
  );

  expect(getByText('Environments')).toBeVisible();
});
