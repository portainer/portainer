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
  const { getByLabelText } = await renderComponent(1, {
    'subscription-1': 2,
  });

  const subscriptionsItem = getByLabelText('subscriptions');
  expect(subscriptionsItem).toBeVisible();

  const subscriptionElements = within(subscriptionsItem);
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('1');
  expect(subscriptionElements.getByLabelText('icon')).toHaveClass('fa-th-list');
  expect(subscriptionElements.getByLabelText('resourceType')).toHaveTextContent(
    'Subscriptions'
  );

  const resourceGroupsItem = getByLabelText('resourceGroups');
  expect(resourceGroupsItem).toBeVisible();

  const resourceGroupElements = within(resourceGroupsItem);
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('2');
  expect(resourceGroupElements.getByLabelText('icon')).toHaveClass(
    'fa-th-list'
  );
  expect(
    resourceGroupElements.getByLabelText('resourceType')
  ).toHaveTextContent('Resource groups');
});

// test('when only subscriptions fail to load, dont show the dashboard', async () => {});

// test('when only resource groups fail to load, still show the subscriptions', async () => {});

async function renderComponent(
  subscriptionsCount = 0,
  resourceGroups: Record<string, number> = {},
  subscriptionsStatus = 200,
  resourceGroupsStatus = 200
) {
  const user = new UserViewModel({ Username: 'user' });
  const state = { user };

  server.use(
    rest.get(
      '/api/endpoints/:endpointId/azure/subscriptions',
      (req, res, ctx) =>
        res(
          ctx.json(createMockSubscriptions(subscriptionsCount)),
          ctx.status(subscriptionsStatus)
        )
    ),
    rest.get(
      '/api/endpoints/:endpointId/azure/subscriptions/:subscriptionId/resourcegroups',
      (req, res, ctx) => {
        if (typeof req.params.subscriptionId !== 'string') {
          throw new Error("Provided subscriptionId must be of type: 'string'");
        }

        const { subscriptionId } = req.params;
        return res(
          ctx.json(
            createMockResourceGroups(
              req.params.subscriptionId,
              resourceGroups[subscriptionId] || 0
            )
          ),
          ctx.status(resourceGroupsStatus)
        );
      }
    )
  );
  const renderResult = renderWithQueryClient(
    <UserContext.Provider value={state}>
      <DashboardView />
    </UserContext.Provider>
  );

  await expect(renderResult.findByText(/Home/)).resolves.toBeVisible();

  return renderResult;
}
