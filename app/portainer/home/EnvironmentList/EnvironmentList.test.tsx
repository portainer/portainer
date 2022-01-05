import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';
import { rest, server } from '@/setup-tests/server';

import { EnvironmentList } from './EnvironmentList';

test('renders correctly', async () => {
  const user = new UserViewModel({ Username: 'test' });

  const { getByText } = renderWithQueryClient(
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

test('when no environments should show empty list message', async () => {
  const user = new UserViewModel({ Username: 'test' });
  server.use(
    rest.get('/api/environments', (req, res, ctx) =>
      res(ctx.set('x-total-count', '0'), ctx.json([]))
    )
  );

  const { findByText } = renderWithQueryClient(
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

  await expect(findByText('No environments available.')).resolves.toBeVisible();
});
