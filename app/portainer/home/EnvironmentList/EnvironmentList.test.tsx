import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';
import { rest, server } from '@/setup-tests/server';

import { EnvironmentList } from './EnvironmentList';

test('renders correctly', async () => {
  const user = new UserViewModel({ Username: 'test' });

  const { getByText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentList onClickItem={jest.fn()} onRefresh={jest.fn()} />
    </UserContext.Provider>
  );

  expect(getByText('Environments')).toBeVisible();
});

test('when no environments for query should show empty list message', async () => {
  const user = new UserViewModel({ Username: 'test' });
  server.use(
    rest.get('/api/environments', (req, res, ctx) =>
      res(ctx.set('x-total-count', '0'), ctx.json([]))
    )
  );

  const { findByText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentList onClickItem={jest.fn()} onRefresh={jest.fn()} />
    </UserContext.Provider>
  );

  await expect(findByText('No environments available.')).resolves.toBeVisible();
});

test('when user is not admin and no environments at all should show empty list info message', async () => {
  const user = new UserViewModel({ Username: 'test' });
  server.use(
    rest.get('/api/environments', (req, res, ctx) =>
      res(ctx.set('x-total-available', '0'), ctx.json([]))
    )
  );

  const { findByText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentList onClickItem={jest.fn()} onRefresh={jest.fn()} />
    </UserContext.Provider>
  );

  await expect(
    findByText(
      'You do not have access to any environment. Please contact your administrator.'
    )
  ).resolves.toBeVisible();
});

test('when user is an admin and no environments at all should show empty list info message', async () => {
  const user = new UserViewModel({ Username: 'test', Role: 1 });
  server.use(
    rest.get('/api/environments', (req, res, ctx) =>
      res(ctx.set('x-total-available', '0'), ctx.json([]))
    )
  );

  const { findByText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentList onClickItem={jest.fn()} onRefresh={jest.fn()} />
    </UserContext.Provider>
  );

  await expect(
    findByText(/No environment available for management. Please head over the/)
  ).resolves.toBeVisible();
});
