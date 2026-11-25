import { render, screen } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { TestSidebarProvider } from './useSidebarState';
import { ObservabilitySidebar } from './ObservabilitySidebar';

test('renders LogForge for authenticated users', () => {
  renderComponent();

  expect(screen.getByText('Observability')).toBeInTheDocument();
  expect(screen.getByText('LogForge')).toBeInTheDocument();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });
  const Wrapped = withUserProvider(withTestRouter(ObservabilitySidebar), user);

  return render(
    <TestSidebarProvider>
      <Wrapped />
    </TestSidebarProvider>
  );
}
