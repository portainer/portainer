import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
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

  const containerInstancesItem = getByLabelText(/Container Instances/i);
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
  const user = new UserViewModel({ Username: 'user' });

  return render(
    <UserContext.Provider value={{ user }}>
      <AzureSidebar environmentId={1} />
    </UserContext.Provider>
  );
}
