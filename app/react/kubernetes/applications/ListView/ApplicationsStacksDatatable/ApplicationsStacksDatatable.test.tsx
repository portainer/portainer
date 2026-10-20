import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { http, server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { ApplicationsStacksDatatable } from './ApplicationsStacksDatatable';

const mockUseEnvironmentId = vi.fn();
const mockUseApplications = vi.fn();

function app(
  name: string,
  namespace: string,
  stackId?: string,
  stackName?: string
) {
  return {
    Id: name,
    Name: name,
    CreationDate: '2021-10-01T00:00:00Z',
    ResourcePool: namespace,
    Image: 'image1',
    ApplicationType: 'Deployment',
    DeploymentType: 'Replicated',
    Status: 'status1',
    TotalPodsCount: 1,
    RunningPodsCount: 1,
    StackId: stackId,
    StackName: stackName,
  };
}

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/applications/queries/useApplications', () => ({
  useApplications: () => mockUseApplications(),
}));

vi.mock('@/react/kubernetes/namespaces/queries/useNamespacesQuery', () => ({
  useNamespacesQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/react/kubernetes/namespaces/queries/useIsSystemNamespace', () => ({
  useIsSystemNamespace: () => false,
  isSystemNamespace: () => false,
}));

vi.mock('@/react/kubernetes/ingresses/queries', () => ({
  useIngresses: () => ({ data: [], isLoading: false }),
}));

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="mock-link">{children}</span>
  ),
}));

function renderComponent({
  search = '',
  sortBy = { id: 'name', desc: false },
}: {
  search?: string;
  sortBy?: { id: string; desc: boolean };
} = {}) {
  server.use(
    http.get('/api/endpoints/:endpointId', () =>
      HttpResponse.json(createMockEnvironment())
    )
  );

  const user = new UserViewModel({ Username: 'user' });
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ApplicationsStacksDatatable), user)
  );

  return render(
    <Wrapped
      tableState={{
        search,
        setSearch: () => {},
        namespace: '',
        setNamespace: () => {},
        showSystemResources: true,
        autoRefreshRateMS: 0,
        setAutoRefreshRate: () => {},
        setShowSystemResources: () => {},
        sortBy,
        setSortBy: () => {},
        pageSize: 10,
        setPageSize: () => {},
      }}
    />
  );
}

function stackRowNames() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[2]?.textContent?.trim())
    .filter((text) => text !== undefined);
}

describe('ApplicationsStacksDatatable', () => {
  beforeEach(() => {
    mockUseEnvironmentId.mockReturnValue(3);
    mockUseApplications.mockReturnValue({
      data: [
        app('app1', 'namespace1', '1', 'alpha'),
        app('app2', 'namespace1', '1', 'alpha'),
        app('app3', 'namespace2', '2', 'beta'),
      ],
      isLoading: false,
    });
  });

  it('should group applications into one row per stack id', async () => {
    renderComponent();

    expect(await screen.findByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(stackRowNames()).toEqual(['alpha', 'beta']);
  });

  it('should show the application count per stack', async () => {
    renderComponent();

    await screen.findByText('alpha');
    const rows = screen.getAllByRole('row').slice(1);
    const alphaCells = within(rows[0]).getAllByRole('cell');
    expect(alphaCells[4]).toHaveTextContent('2');
    const betaCells = within(rows[1]).getAllByRole('cell');
    expect(betaCells[4]).toHaveTextContent('1');
  });

  it('should show the namespaces of the applications in the stack', async () => {
    renderComponent();

    await screen.findByText('alpha');
    expect(screen.getByText('namespace1')).toBeInTheDocument();
    expect(screen.getByText('namespace2')).toBeInTheDocument();
  });

  it('should show every namespace of a stack that spans several namespaces', async () => {
    mockUseApplications.mockReturnValue({
      data: [
        app('app1', 'namespace1', '1', 'alpha'),
        app('app2', 'namespace2', '1', 'alpha'),
      ],
      isLoading: false,
    });
    renderComponent();

    await screen.findByText('alpha');
    expect(stackRowNames()).toEqual(['alpha']);
    expect(screen.getByText('namespace1')).toBeInTheDocument();
    expect(screen.getByText('namespace2')).toBeInTheDocument();

    const namespaceCell = within(screen.getAllByRole('row')[1]).getAllByRole(
      'cell'
    )[3];
    expect(namespaceCell).toHaveTextContent('namespace1,namespace2');
  });

  it('should keep stacks that share a name separate', async () => {
    mockUseApplications.mockReturnValue({
      data: [
        app('app1', 'namespace1', '1', 'samename'),
        app('app2', 'namespace2', '2', 'samename'),
      ],
      isLoading: false,
    });
    renderComponent();

    await screen.findAllByText('samename');
    expect(stackRowNames()).toEqual(['samename', 'samename']);
  });

  it('should not show applications that are not part of a stack', async () => {
    mockUseApplications.mockReturnValue({
      data: [
        app('app1', 'namespace1', '1', 'alpha'),
        app('kube-proxy', 'kube-system'),
        app('placeholder', 'namespace1', '0', 'ghost'),
      ],
      isLoading: false,
    });
    renderComponent();

    await screen.findByText('alpha');
    expect(stackRowNames()).toEqual(['alpha']);
    expect(screen.queryByText('ghost')).not.toBeInTheDocument();
  });

  it('should filter stacks by name when searching', async () => {
    renderComponent({ search: 'beta' });

    expect(await screen.findByText('beta')).toBeInTheDocument();
    expect(stackRowNames()).toEqual(['beta']);
  });

  it('should filter stacks by namespace when searching', async () => {
    renderComponent({ search: 'namespace2' });

    expect(await screen.findByText('beta')).toBeInTheDocument();
    expect(stackRowNames()).toEqual(['beta']);
  });

  it('should sort stacks by name descending', async () => {
    renderComponent({ sortBy: { id: 'name', desc: true } });

    await screen.findByText('alpha');
    expect(stackRowNames()).toEqual(['beta', 'alpha']);
  });

  it('should sort stacks by namespace', async () => {
    renderComponent({ sortBy: { id: 'namespace', desc: true } });

    await screen.findByText('alpha');
    expect(stackRowNames()).toEqual(['beta', 'alpha']);
  });
  it('should expand a stack to show its applications', async () => {
    renderComponent();

    await screen.findByText('alpha');
    const alphaRow = screen.getAllByRole('row')[1];
    const expandButton = within(alphaRow).getAllByRole('button')[0];
    await userEvent.click(expandButton);

    expect(await screen.findByText('app1')).toBeInTheDocument();
    expect(screen.getByText('app2')).toBeInTheDocument();
  });

  it('should select a single stack when two stacks share a name', async () => {
    mockUseApplications.mockReturnValue({
      data: [
        app('app1', 'namespace1', '1', 'samename'),
        app('app2', 'namespace2', '2', 'samename'),
      ],
      isLoading: false,
    });
    renderComponent();

    await screen.findAllByText('samename');
    const checkboxes = screen.getAllByRole('checkbox');
    // first checkbox is the select-all in the header
    await userEvent.click(checkboxes[1]);

    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });
});
