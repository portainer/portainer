import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render, within } from '@/react-tools/test-utils';

import { TestSidebarProvider } from '../useSidebarState';

import { AzureSidebar } from './AzureSidebar';

test('dashboard items should render correctly', () => {
  const { getByLabelText } = renderComponent();
  const dashboardItem = getByLabelText('Dashboard');
  expect(dashboardItem).toBeVisible();
  expect(dashboardItem).toHaveTextContent('Dashboard');

  const dashboardItemElements = within(dashboardItem);
  expect(
    dashboardItemElements.getByRole('img', { hidden: true })
  ).toBeVisible();

  const containerInstancesItem = getByLabelText(/Container Instances/i);
  expect(containerInstancesItem).toBeVisible();
  expect(containerInstancesItem).toHaveTextContent('Container instances');

  const containerInstancesItemElements = within(containerInstancesItem);
  expect(
    containerInstancesItemElements.getByRole('img', { hidden: true })
  ).toBeVisible();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return render(
    <UserContext.Provider value={{ user }}>
      <TestSidebarProvider>
        <AzureSidebar environmentId={1} />
      </TestSidebarProvider>
    </UserContext.Provider>
  );
}
