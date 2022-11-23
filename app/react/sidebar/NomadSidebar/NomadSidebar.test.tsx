import { UserContext } from '@/react/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render, within } from '@/react-tools/test-utils';

import { TestSidebarProvider } from '../useSidebarState';

import { NomadSidebar } from './NomadSidebar';

test('dashboard items should render correctly', () => {
  const { getByLabelText } = renderComponent();
  const dashboardItem = getByLabelText(/Dashboard/i);
  expect(dashboardItem).toBeVisible();
  expect(dashboardItem).toHaveTextContent('Dashboard');

  const dashboardItemElements = within(dashboardItem);
  expect(
    dashboardItemElements.getByRole('img', { hidden: true })
  ).toBeVisible();

  const jobsItem = getByLabelText('Nomad Jobs');
  expect(jobsItem).toBeVisible();
  expect(jobsItem).toHaveTextContent('Jobs');

  const jobsItemElements = within(jobsItem);
  expect(jobsItemElements.getByRole('img', { hidden: true })).toBeVisible();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return render(
    <UserContext.Provider value={{ user }}>
      <TestSidebarProvider>
        <NomadSidebar environmentId={1} />
      </TestSidebarProvider>
    </UserContext.Provider>
  );
}
