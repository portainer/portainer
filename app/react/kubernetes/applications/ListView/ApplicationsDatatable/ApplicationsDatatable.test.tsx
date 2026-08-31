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

import {
  HelmReleaseNameAnnotation,
  HelmReleaseNamespaceAnnotation,
  PodKubernetesInstanceLabel,
  PodManagedByLabel,
} from '../../constants';

import { ApplicationsDatatable } from './ApplicationsDatatable';

const mockUseCurrentStateAndParams = vi.fn();
const mockUseEnvironmentId = vi.fn();

function helmApp(id: string, namespace: string, releaseName: string) {
  return {
    Id: id,
    Name: `app${id}`,
    CreationDate: '2021-10-01T00:00:00Z',
    ResourcePool: namespace,
    Image: 'image1',
    ApplicationType: 'Pod',
    Kind: 'Pod',
    DeploymentType: 'Replicated',
    Status: 'status1',
    TotalPodsCount: 1,
    RunningPodsCount: 1,
    Metadata: {
      labels: {
        [PodKubernetesInstanceLabel]: releaseName,
        [PodManagedByLabel]: 'Helm',
      },
      annotations: {
        [HelmReleaseNameAnnotation]: releaseName,
        [HelmReleaseNamespaceAnnotation]: namespace,
      },
    },
  };
}

function appInNamespace(id: string, namespace: string, stackId?: string) {
  return {
    Id: id,
    Name: `app${id}`,
    CreationDate: '2021-10-01T00:00:00Z',
    ResourcePool: namespace,
    Image: 'image1',
    ApplicationType: 'Pod',
    Kind: 'Pod',
    DeploymentType: 'Replicated',
    Status: 'status1',
    TotalPodsCount: 1,
    RunningPodsCount: 1,
    StackId: stackId,
  };
}

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: () => mockUseCurrentStateAndParams(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="mock-link">{children}</span>
  ),
}));

vi.mock('@/react/kubernetes/components/CreateFromManifestButton', () => ({
  CreateFromManifestButton: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    'data-cy'?: string;
  }) => (
    <button type="button" data-testid="mock-create-manifest-button" {...props}>
      {children || 'Create from manifest'}
    </button>
  ),
}));

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

  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ApplicationsDatatable), user)
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
        sortBy: { id: 'Name', desc: false },
        setSortBy: () => {},
        pageSize: 10,
        setPageSize: () => {},
      }}
    />
  );
}

describe('ApplicationsDatatable', () => {
  beforeEach(() => {
    server.use(http.get('/api/stacks', () => HttpResponse.json([])));
    mockUseEnvironmentId.mockReturnValue(3);
    mockUseCurrentStateAndParams.mockReturnValue({
      params: {},
    });
    mockApplications([
      helmApp('1', 'namespace1', 'helm-release-1'),
      helmApp('2', 'namespace1', 'helm-release-1'),
      helmApp('3', 'namespace2', 'helm-release-1'),
    ]);
  });

  it('should group helm apps by release namespace and release name', async () => {
    renderComponent();

    const helmReleases = await screen.findAllByText('helm-release-1');
    expect(helmReleases).toHaveLength(2);

    // Should show both namespaces in table cells
    const namespace1Cells = await screen.findAllByRole('cell', {
      name: 'namespace1',
    });
    const namespace2Cells = await screen.findAllByRole('cell', {
      name: 'namespace2',
    });
    expect(namespace1Cells.length).toBeGreaterThan(0);
    expect(namespace2Cells.length).toBeGreaterThan(0);
  });

  it('shows a Workflow badge for workflow-managed applications', async () => {
    mockApplications([
      appInNamespace('1', 'namespace1', '10'),
      appInNamespace('2', 'namespace2', '20'),
    ]);
    server.use(
      http.get('/api/stacks', () =>
        HttpResponse.json([
          createMockWorkflowManagedStack({
            Id: 10,
            EndpointId: 3,
            Type: StackType.Kubernetes,
          }),
          createMockStack({
            Id: 20,
            EndpointId: 3,
            Type: StackType.Kubernetes,
          }),
        ])
      )
    );

    renderComponent();

    expect(await screen.findByText('Workflow')).toBeInTheDocument();
  });

  it('should not group workloads that only carry the chart labels', async () => {
    // a `helm template` / `--dry-run` manifest applied with kubectl renders the chart's
    // managed-by and instance labels, but Helm never stamps the meta.helm.sh annotations
    const rendered = helmApp('1', 'namespace1', 'helm-release-1');
    mockApplications([
      { ...rendered, Metadata: { labels: rendered.Metadata.labels } },
    ]);

    renderComponent();

    expect(await screen.findByText('app1')).toBeInTheDocument();
    expect(screen.queryByText('helm-release-1')).not.toBeInTheDocument();
  });

  it('should handle workloads with no labels or annotations', async () => {
    // the API sends null rather than an empty object for a workload with neither
    const app = helmApp('1', 'namespace1', 'helm-release-1');
    mockApplications([
      { ...app, Metadata: { labels: null, annotations: null } },
    ]);

    renderComponent();

    expect(await screen.findByText('app1')).toBeInTheDocument();
  });
});
