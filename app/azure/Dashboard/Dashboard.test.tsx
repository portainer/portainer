import { renderWithQueryClient, within } from '@/react-tools/test-utils';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { server, rest } from '@/setup-tests/server';
import {
  createMockResourceGroups,
  createMockSubscriptions,
} from '@/react-tools/test-mocks';

import { DashboardView } from './DashboardView';

jest.mock('@uirouter/react', () => ({
  ...jest.requireActual('@uirouter/react'),
  useCurrentStateAndParams: jest.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

test('when there are no errors, load dashboard correctly', async () => {
  const { getByLabelText } = await renderComponent();

  const subscriptionsItem = getByLabelText('subscriptions');
  expect(subscriptionsItem).toBeVisible();

  const subscriptionElements = within(subscriptionsItem);
  expect(await subscriptionElements.findByLabelText('value')).toHaveTextContent(
    '1'
  );
  expect(await subscriptionElements.findByLabelText('icon')).toHaveClass(
    'fa-th-list'
  );
  expect(
    await subscriptionElements.findByLabelText('resourceType')
  ).toHaveTextContent('Subscriptions');

  const resourceGroupsItem = getByLabelText('resourceGroups');
  expect(resourceGroupsItem).toBeVisible();

  const resourceGroupElements = within(resourceGroupsItem);
  expect(
    await resourceGroupElements.findByLabelText('value')
  ).toHaveTextContent('2');
  expect(await resourceGroupElements.findByLabelText('icon')).toHaveClass(
    'fa-th-list'
  );
  expect(
    await resourceGroupElements.findByLabelText('resourceType')
  ).toHaveTextContent(/Resource groups/);
});

// test('when only subscriptions fail to load, dont show the dashboard', async () => {});

// test('when only resource groups fail to load, still show the subscriptions', async () => {});

async function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });
  const state = { user };

  server.use(
    rest.get(
      '/api/endpoints/1/azure/subscriptions?api-version=2016-06-01',
      (req, res, ctx) => res(ctx.json(createMockSubscriptions(1)))
    ),
    rest.get(
      '/api/endpoints/1/azure/subscriptions/subscription-1/resourcegroups?api-version=2018-02-01',
      (req, res, ctx) =>
        res(ctx.json(createMockResourceGroups('subscription-1', 2)))
    )
  );
  const renderResult = renderWithQueryClient(
    <UserContext.Provider value={state}>
      <DashboardView />
    </UserContext.Provider>
  );

  await expect(
    renderResult.findByLabelText('subscriptions')
  ).resolves.toBeVisible();

  return renderResult;
}
