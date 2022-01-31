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

test('dashboard items should render correctly', async () => {
  const { findByLabelText } = await renderComponent();

  const subscriptionsItem = await findByLabelText('Subscriptions');
  expect(subscriptionsItem).toBeVisible();

  const subscriptionElements = within(subscriptionsItem);
  expect(subscriptionElements.getByLabelText('value')).toBeVisible();
  expect(subscriptionElements.getByLabelText('icon')).toHaveClass('fa-th-list');
  expect(subscriptionElements.getByLabelText('resourceType')).toHaveTextContent(
    'Subscriptions'
  );

  const resourceGroupsItem = await findByLabelText('Resource groups');
  expect(resourceGroupsItem).toBeVisible();

  const resourceGroupElements = within(resourceGroupsItem);
  expect(resourceGroupElements.getByLabelText('value')).toBeVisible();
  expect(resourceGroupElements.getByLabelText('icon')).toHaveClass(
    'fa-th-list'
  );
  expect(
    resourceGroupElements.getByLabelText('resourceType')
  ).toHaveTextContent('Resource groups');
});

test('when there are no subscriptions, should show 0 subscriptions and 0 resource groups', async () => {
  const { findByLabelText } = await renderComponent();

  const subscriptionElements = within(await findByLabelText('Subscriptions'));
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('0');

  const resourceGroupElements = within(
    await findByLabelText('Resource groups')
  );
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('0');
});

test('when there is subscription & resource group data, should display these', async () => {
  const { findByLabelText } = await renderComponent(1, { 'subscription-1': 2 });

  const subscriptionElements = within(await findByLabelText('Subscriptions'));
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('1');

  const resourceGroupElements = within(
    await findByLabelText('Resource groups')
  );
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('2');
});

test('should correctly show total number of resource groups across multiple subscriptions', async () => {
  const { findByLabelText } = await renderComponent(2, {
    'subscription-1': 2,
    'subscription-2': 3,
  });

  const resourceGroupElements = within(
    await findByLabelText('Resource groups')
  );
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('5');
});

test('when only subscriptions fail to load, dont show the dashboard', async () => {
  const { queryByLabelText } = await renderComponent(
    1,
    { 'subscription-1': 1 },
    500,
    200
  );
  expect(queryByLabelText('Subscriptions')).not.toBeInTheDocument();
  expect(queryByLabelText('Resource groups')).not.toBeInTheDocument();
});

test('when only resource groups fail to load, still show the subscriptions', async () => {
  const { queryByLabelText, findByLabelText } = await renderComponent(
    1,
    { 'subscription-1': 1 },
    200,
    500
  );
  await expect(findByLabelText('Subscriptions')).resolves.toBeInTheDocument();
  expect(queryByLabelText('Resource groups')).not.toBeInTheDocument();
});

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
