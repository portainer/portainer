import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { http, server } from '@/setup-tests/server';
import {
  createMockEnvironment,
  createMockStack,
  createMockWorkflowManagedStack,
} from '@/react-tools/test-mocks';
import { StackType } from '@/react/common/stacks/types';
import { Role } from '@/portainer/users/types';

import { ApplicationsStacksDatatable } from './ApplicationsStacksDatatable';

const mockUseCurrentStateAndParams = vi.fn();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: () => mockUseCurrentStateAndParams(),
}));

describe('ApplicationsStacksDatatable', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/stacks', () => HttpResponse.json([])),
      http.get('/api/kubernetes/:environmentId/namespaces', () =>
        HttpResponse.json([
          { Name: 'namespace1', IsSystem: false },
          { Name: 'namespace2', IsSystem: false },
        ])
      )
    );
    mockUseCurrentStateAndParams.mockReturnValue({ params: { endpointId: 3 } });
  });

  it('shows a Workflow badge for workflow-managed stacks', async () => {
    server.use(
      http.get('/api/stacks', () =>
        HttpResponse.json([
          createMockWorkflowManagedStack({
            Id: 10,
            Name: 'stack-a',
            EndpointId: 3,
            Type: StackType.Kubernetes,
          }),
          createMockStack({
            Id: 20,
            Name: 'stack-b',
            EndpointId: 3,
            Type: StackType.Kubernetes,
          }),
        ])
      )
    );

    // application StackId must reference the workflow-managed stack for stack-a
    mockApplications([
      { ...appInStack('1', 'stack-a', 'namespace1'), StackId: '10' },
      { ...appInStack('2', 'stack-b', 'namespace2'), StackId: '20' },
    ]);

    renderComponent();

    expect(await screen.findByText('Workflow')).toBeInTheDocument();
  });
});

function mockApplications(apps: Array<unknown>) {
  server.use(
    http.get('/api/kubernetes/:environmentId/applications', () =>
      HttpResponse.json(apps)
    )
  );
}

function renderComponent() {
  server.use(
    http.get('/api/endpoints/:endpointId', () =>
      HttpResponse.json(createMockEnvironment())
    )
  );

  const user = new UserViewModel({ Username: 'user', Role: Role.Admin });

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ApplicationsStacksDatatable), user)
  );

  return render(
    <Wrapped
      tableState={{
        search: '',
        setSearch: () => {},
        namespace: '',
        setNamespace: () => {},
        showSystemResources: false,
        autoRefreshRateMS: 0,
        setAutoRefreshRate: () => {},
        setShowSystemResources: () => {},
        sortBy: { id: 'name', desc: false },
        setSortBy: () => {},
        pageSize: 10,
        setPageSize: () => {},
      }}
    />
  );
}

function appInStack(id: string, stackName: string, namespace: string) {
  return {
    Id: id,
    Name: `app${id}`,
    StackName: stackName,
    CreationDate: '2021-10-01T00:00:00Z',
    ResourcePool: namespace,
    Image: 'image1',
    ApplicationType: 'Pod',
    Kind: 'Pod',
    DeploymentType: 'Replicated',
    Status: 'status1',
    TotalPodsCount: 1,
    RunningPodsCount: 1,
  };
}
