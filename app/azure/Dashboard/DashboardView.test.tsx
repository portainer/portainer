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
  const { getByLabelText } = await renderComponent();

  const subscriptionsItem = getByLabelText('Subscription');
  expect(subscriptionsItem).toBeVisible();

  const subscriptionElements = within(subscriptionsItem);
  expect(subscriptionElements.getByLabelText('value')).toBeVisible();
  expect(subscriptionElements.getByRole('img', { hidden: true })).toHaveClass(
    'fa-th-list'
  );
  expect(subscriptionElements.getByLabelText('resourceType')).toHaveTextContent(
    'Subscriptions'
  );

  const resourceGroupsItem = getByLabelText('Resource group');
  expect(resourceGroupsItem).toBeVisible();

  const resourceGroupElements = within(resourceGroupsItem);
  expect(resourceGroupElements.getByLabelText('value')).toBeVisible();
  expect(resourceGroupElements.getByRole('img', { hidden: true })).toHaveClass(
    'fa-th-list'
  );
  expect(
    resourceGroupElements.getByLabelText('resourceType')
  ).toHaveTextContent('Resource groups');
});

test('when there are no subscriptions, should show 0 subscriptions and 0 resource groups', async () => {
  const { getByLabelText } = await renderComponent();

  const subscriptionElements = within(getByLabelText('Subscription'));
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('0');

  const resourceGroupElements = within(getByLabelText('Resource group'));
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('0');
});

test('when there is subscription & resource group data, should display these', async () => {
  const { getByLabelText } = await renderComponent(1, { 'subscription-1': 2 });

  const subscriptionElements = within(getByLabelText('Subscription'));
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('1');

  const resourceGroupElements = within(getByLabelText('Resource group'));
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('2');
});

test('should correctly show total number of resource groups across multiple subscriptions', async () => {
  const { getByLabelText } = await renderComponent(2, {
    'subscription-1': 2,
    'subscription-2': 3,
  });

  const resourceGroupElements = within(getByLabelText('Resource group'));
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('5');
});

test('when only subscriptions fail to load, dont show the dashboard', async () => {
  const { queryByLabelText } = await renderComponent(
    1,
    { 'subscription-1': 1 },
    500,
    200
  );
  expect(queryByLabelText('Subscription')).not.toBeInTheDocument();
  expect(queryByLabelText('Resource group')).not.toBeInTheDocument();
});

test('when only resource groups fail to load, still show the subscriptions', async () => {
  const { queryByLabelText } = await renderComponent(
    1,
    { 'subscription-1': 1 },
    200,
    500
  );
  expect(queryByLabelText('Subscription')).toBeInTheDocument();
  expect(queryByLabelText('Resource group')).not.toBeInTheDocument();
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
