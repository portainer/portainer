import { render, within } from '@/react-tools/test-utils';

import { AzureSidebar } from './AzureSidebar';

test('dashboard items should render correctly', () => {
  const { getByLabelText } = renderComponent();
  const dashboardItem = getByLabelText('Dashboard');
  expect(dashboardItem).toBeVisible();
  expect(dashboardItem).toHaveTextContent('Dashboard');

  const dashboardItemElements = within(dashboardItem);
  expect(dashboardItemElements.getByLabelText('itemIcon')).toBeVisible();
  expect(dashboardItemElements.getByLabelText('itemIcon')).toHaveClass(
    'fa-tachometer-alt',
    'fa-fw'
  );

  const containerInstancesItem = getByLabelText('ContainerInstances');
  expect(containerInstancesItem).toBeVisible();
  expect(containerInstancesItem).toHaveTextContent('Container instances');

  const containerInstancesItemElements = within(containerInstancesItem);
  expect(
    containerInstancesItemElements.getByLabelText('itemIcon')
  ).toBeVisible();
  expect(containerInstancesItemElements.getByLabelText('itemIcon')).toHaveClass(
    'fa-cubes',
    'fa-fw'
  );
});

function renderComponent() {
  return render(<AzureSidebar environmentId={1} />);
}
