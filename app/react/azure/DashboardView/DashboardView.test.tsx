import { http, HttpResponse } from 'msw';
import { render, within } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';
import {
  createMockResourceGroups,
  createMockSubscriptions,
} from '@/react-tools/test-mocks';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { DashboardView } from './DashboardView';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

test('dashboard items should render correctly', async () => {
  const { findByLabelText } = await renderComponent();

  const subscriptionsItem = await findByLabelText('Subscription');
  expect(subscriptionsItem).toBeVisible();

  const subscriptionElements = within(subscriptionsItem);
  expect(subscriptionElements.getByLabelText('value')).toBeVisible();

  expect(subscriptionElements.getByLabelText('resourceType')).toHaveTextContent(
    'Subscriptions'
  );

  const resourceGroupsItem = await findByLabelText('Resource group');
  expect(resourceGroupsItem).toBeVisible();

  const resourceGroupElements = within(resourceGroupsItem);
  expect(resourceGroupElements.getByLabelText('value')).toBeVisible();

  expect(
    resourceGroupElements.getByLabelText('resourceType')
  ).toHaveTextContent('Resource groups');
});

test('when there are no subscriptions, should show 0 subscriptions and 0 resource groups', async () => {
  const { findByLabelText } = await renderComponent();

  const subscriptionElements = within(await findByLabelText('Subscription'));
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('0');

  const resourceGroupElements = within(await findByLabelText('Resource group'));
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('0');
});

test('when there is subscription & resource group data, should display these', async () => {
  const { findByLabelText } = await renderComponent(1, { 'subscription-1': 2 });

  const subscriptionElements = within(await findByLabelText('Subscription'));
  expect(subscriptionElements.getByLabelText('value')).toHaveTextContent('1');

  const resourceGroupElements = within(await findByLabelText('Resource group'));
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('2');
});

test('should correctly show total number of resource groups across multiple subscriptions', async () => {
  const { findByLabelText } = await renderComponent(2, {
    'subscription-1': 2,
    'subscription-2': 3,
  });

  const resourceGroupElements = within(await findByLabelText('Resource group'));
  expect(resourceGroupElements.getByLabelText('value')).toHaveTextContent('5');
});

test("when only subscriptions fail to load, don't show the dashboard", async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});

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
  vi.spyOn(console, 'error').mockImplementation(() => {});

  const { queryByLabelText, findByLabelText } = await renderComponent(
    1,
    { 'subscription-1': 1 },
    200,
    500
  );
  await expect(findByLabelText('Subscription')).resolves.toBeInTheDocument();
  expect(queryByLabelText('Resource group')).not.toBeInTheDocument();
});

async function renderComponent(
  subscriptionsCount = 0,
  resourceGroups: Record<string, number> = {},
  subscriptionsStatus = 200,
  resourceGroupsStatus = 200
) {
  const user = new UserViewModel({ Username: 'user' });

  server.use(
    http.get('/api/endpoints/1', () => HttpResponse.json({})),

    http.get('/api/endpoints/:endpointId/azure/subscriptions', () =>
      HttpResponse.json(createMockSubscriptions(subscriptionsCount), {
        status: subscriptionsStatus,
      })
    ),
    http.get(
      '/api/endpoints/:endpointId/azure/subscriptions/:subscriptionId/resourcegroups',
      ({ params }) => {
        if (typeof params.subscriptionId !== 'string') {
          throw new Error("Provided subscriptionId must be of type: 'string'");
        }

        const { subscriptionId } = params;
        return HttpResponse.json(
          createMockResourceGroups(
            subscriptionId,
            resourceGroups[subscriptionId] || 0
          ),
          {
            status: resourceGroupsStatus,
          }
        );
      }
    )
  );

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(DashboardView), user)
  );

  const renderResult = render(<Wrapped />);

  await expect(renderResult.findByText(/Home/)).resolves.toBeVisible();

  return renderResult;
}
