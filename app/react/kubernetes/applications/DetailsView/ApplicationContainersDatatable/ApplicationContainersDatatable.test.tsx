import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import { server, http } from '@/setup-tests/server';
import { mockLocalizeDate } from '@/setup-tests/mock-localizeDate';

import { confirmDelete } from '@@/modals/confirm';

import { ApplicationContainersDatatable } from './ApplicationContainersDatatable';

const mockUseCurrentStateAndParams = vi.fn();
const mockUseEnvironmentId = vi.fn();

mockLocalizeDate();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: () => mockUseCurrentStateAndParams(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@@/Link', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a
      href={`#${to}`}
      {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {children}
    </a>
  ),
}));

vi.mock('@@/modals/confirm', () => ({
  confirmDelete: vi.fn(),
}));

const mockDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'test-app',
    namespace: 'test-namespace',
  },
  spec: {
    selector: {
      matchLabels: { app: 'test-app' },
    },
    replicas: 1,
  },
  status: { replicas: 1, readyReplicas: 1 },
};

const mockPod = {
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: { name: 'test-pod-1', namespace: 'test-namespace' },
  spec: {
    nodeName: 'node-1',
    containers: [
      {
        name: 'nginx',
        image: 'nginx:latest',
        imagePullPolicy: 'Always',
      },
    ],
  },
  status: {
    phase: 'Running',
    podIP: '10.0.0.1',
    startTime: '2023-01-01T00:00:00Z',
    containerStatuses: [
      {
        name: 'nginx',
        ready: true,
        restartCount: 0,
        image: 'nginx:latest',
        imageID: 'sha256:abc123',
        state: { running: { startedAt: '2023-01-01T00:01:00Z' } },
      },
    ],
  },
};

const mockPodsResponse = {
  apiVersion: 'v1',
  kind: 'PodList',
  items: [mockPod],
};

const mockKubernetesVersion = {
  major: '1',
  minor: '35',
  gitVersion: 'v1.35.0',
  gitCommit: 'abc123',
  gitTreeState: 'clean',
  buildDate: '2025-01-01T00:00:00Z',
  goVersion: 'go1.22.0',
  compiler: 'gc',
  platform: 'linux/amd64',
  supportsPodRestart: true,
};

const mockEnvironment = {
  Id: 1,
  Name: 'Test Environment',
  Type: 1,
  Kubernetes: {
    Configuration: { UseServerMetrics: false },
  },
};

function renderComponent() {
  const user = new UserViewModel({ Username: 'user', Role: 1 });
  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => <ApplicationContainersDatatable />),
      user
    )
  );
  return render(<Wrapped />);
}

describe('ApplicationContainersDatatable', () => {
  beforeEach(() => {
    mockUseEnvironmentId.mockReturnValue(1);
    mockUseCurrentStateAndParams.mockReturnValue({
      params: {
        name: 'test-app',
        namespace: 'test-namespace',
        'resource-type': 'Deployment',
      },
    });
    vi.mocked(confirmDelete).mockResolvedValue(true);

    server.use(
      http.get('/api/endpoints/1', () => HttpResponse.json(mockEnvironment)),
      http.get(
        '/api/endpoints/1/kubernetes/apis/apps/v1/namespaces/test-namespace/deployments/test-app',
        () => HttpResponse.json(mockDeployment)
      ),
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/test-namespace/pods',
        () => HttpResponse.json(mockPodsResponse)
      ),
      http.get('/api/kubernetes/1/version', () =>
        HttpResponse.json(mockKubernetesVersion)
      )
    );
  });

  it('renders a row for each pod', async () => {
    const secondPod = {
      ...mockPod,
      metadata: { ...mockPod.metadata, name: 'test-pod-2' },
    };
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/test-namespace/pods',
        () =>
          HttpResponse.json({
            ...mockPodsResponse,
            items: [mockPod, secondPod],
          })
      )
    );

    renderComponent();

    expect(await screen.findByText('test-pod-1')).toBeVisible();
    expect(await screen.findByText('test-pod-2')).toBeVisible();
  });

  it('shows loading state while data is fetching', async () => {
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/apis/apps/v1/namespaces/test-namespace/deployments/test-app',
        () => new Promise(() => {})
      )
    );

    renderComponent();

    expect(await screen.findByText('Loading...')).toBeVisible();
  });

  it('shows "No items." when the pod list is empty', async () => {
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/test-namespace/pods',
        () => HttpResponse.json({ ...mockPodsResponse, items: [] })
      )
    );

    renderComponent();

    await screen.findByText('Application pods');
    expect(await screen.findByText('No items.')).toBeVisible();
  });

  it('collapses a pod row to hide its containers', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByText('test-pod-1');

    await user.click(screen.getByRole('button', { name: 'Collapse' }));

    expect(await screen.queryAllByText('nginx')).toStrictEqual([]);
  });

  it('shows the Init badge for init containers', async () => {
    const podWithInit = {
      ...mockPod,
      spec: {
        ...mockPod.spec,
        initContainers: [
          {
            name: 'init-setup',
            image: 'busybox:latest',
            imagePullPolicy: 'IfNotPresent',
          },
        ],
      },
      status: {
        ...mockPod.status,
        initContainerStatuses: [
          {
            name: 'init-setup',
            ready: true,
            restartCount: 0,
            image: 'busybox:latest',
            imageID: 'sha256:def456',
            state: {
              terminated: {
                exitCode: 0,
                startedAt: '2023-01-01T00:00:30Z',
                finishedAt: '2023-01-01T00:00:55Z',
              },
            },
          },
        ],
      },
    };
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/test-namespace/pods',
        () => HttpResponse.json({ ...mockPodsResponse, items: [podWithInit] })
      )
    );

    renderComponent();

    await screen.findByText('test-pod-1');

    expect(await screen.findByText('Init')).toBeVisible();
  });

  it('shows the Sidecar badge for sidecar init containers', async () => {
    const podWithSidecar = {
      ...mockPod,
      spec: {
        ...mockPod.spec,
        initContainers: [
          {
            name: 'sidecar-proxy',
            image: 'envoy:latest',
            imagePullPolicy: 'IfNotPresent',
            restartPolicy: 'Always',
          },
        ],
      },
      status: {
        ...mockPod.status,
        initContainerStatuses: [
          {
            name: 'sidecar-proxy',
            ready: true,
            restartCount: 0,
            image: 'envoy:latest',
            imageID: 'sha256:ghi789',
            state: { running: { startedAt: '2023-01-01T00:01:00Z' } },
          },
        ],
      },
    };
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/test-namespace/pods',
        () =>
          HttpResponse.json({ ...mockPodsResponse, items: [podWithSidecar] })
      )
    );

    renderComponent();
    await screen.findByText('test-pod-1');

    expect(await screen.findByText('Sidecar')).toBeVisible();
  });

  it('shows the stats link for running containers when server metrics is enabled', async () => {
    server.use(
      http.get('/api/endpoints/1', () =>
        HttpResponse.json({
          ...mockEnvironment,
          Kubernetes: { Configuration: { UseServerMetrics: true } },
        })
      )
    );

    renderComponent();

    await screen.findByText('test-pod-1');

    expect(
      await screen.findByTestId('application-container-stats-nginx')
    ).toBeVisible();
  });

  it('hides the stats link when server metrics is disabled', async () => {
    renderComponent();

    await screen.findByText('test-pod-1');

    await screen.findByText('nginx');
    expect(
      screen.queryByTestId('application-container-stats-nginx')
    ).not.toBeInTheDocument();
  });

  it('shows the logs link for a container that has started', async () => {
    renderComponent();

    await screen.findByText('test-pod-1');

    expect(
      await screen.findByTestId('application-container-logs-nginx')
    ).toBeVisible();
  });

  it('does not render a restart button', async () => {
    renderComponent();

    await screen.findByText('test-pod-1');

    expect(
      screen.queryByTestId('application-pod-restart-test-pod-1')
    ).not.toBeInTheDocument();
  });

  it('calls the delete API after the user confirms deletion', async () => {
    let deleteRequested = false;
    server.use(
      http.delete(
        '/api/kubernetes/1/namespaces/test-namespace/pods/test-pod-1',
        () => {
          deleteRequested = true;
          return HttpResponse.json({});
        }
      )
    );

    const user = userEvent.setup();
    renderComponent();

    await screen.findByText('test-pod-1');
    await user.click(screen.getByTestId('application-pod-delete-test-pod-1'));

    await waitFor(() => {
      expect(deleteRequested).toBe(true);
    });
  });

  it('always shows the delete button regardless of restart strategy support', async () => {
    server.use(
      http.get('/api/kubernetes/1/version', () =>
        HttpResponse.json({
          ...mockKubernetesVersion,
          supportsPodRestart: false,
        })
      )
    );

    renderComponent();

    await screen.findByText('test-pod-1');

    expect(
      screen.getByTestId('application-pod-delete-test-pod-1')
    ).toBeInTheDocument();
  });
});
