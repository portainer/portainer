import { Environment } from '@/portainer/environments/types';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';
import { rest, server } from '@/setup-tests/server';

import { EnvironmentList } from './EnvironmentList';

test('when no environments for query should show empty list message', async () => {
  const { findByText } = await renderComponent(false, []);

  await expect(findByText('No environments available.')).resolves.toBeVisible();
});

test('when user is not admin and no environments at all should show empty list info message', async () => {
  const { findByText } = await renderComponent(false, []);

  await expect(
    findByText(
      'You do not have access to any environment. Please contact your administrator.'
    )
  ).resolves.toBeVisible();
});

test('when user is an admin and no environments at all should show empty list info message', async () => {
  const { findByText } = await renderComponent(true);

  await expect(
    findByText(/No environment available for management. Please head over the/)
  ).resolves.toBeVisible();
});

async function renderComponent(
  isAdmin = false,
  environments: Environment[] = []
) {
  const user = new UserViewModel({ Username: 'test', Role: isAdmin ? 1 : 2 });

  server.use(
    rest.get('/api/endpoints', (req, res, ctx) =>
      res(
        ctx.set('x-total-available', environments.length.toString()),
        ctx.set('x-total-count', environments.length.toString()),
        ctx.json(environments)
      )
    )
  );

  const queries = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentList onClickItem={jest.fn()} onRefresh={jest.fn()} />
    </UserContext.Provider>
  );

  await expect(queries.findByText('Environments')).resolves.toBeVisible();

  return queries;
}
