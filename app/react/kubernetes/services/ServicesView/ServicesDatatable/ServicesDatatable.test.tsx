import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { createMockUsers } from '@/react-tools/test-mocks';
import { server, http } from '@/setup-tests/server';

import { ServicesDatatable } from './ServicesDatatable';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
function createMockServices(count: number) {
  return Array.from({ length: count }, (_, i) => {
    let namespace = 'default';
    if (i % 3 === 0) {
      namespace = 'kube-system';
    } else if (i % 2 !== 0) {
      namespace = 'my-namespace';
    }

    let type = 'ClusterIP';
    if (i % 4 === 1) {
      type = 'NodePort';
    } else if (i % 4 === 2) {
      type = 'LoadBalancer';
    } else if (i % 4 === 3) {
      type = 'ExternalName';
    }

    return {
      UID: `service-${i}`,
      Name: `service-${i}`,
      Namespace: namespace,
      Type: type,
      Ports: [{ Port: 80 + i, TargetPort: 8080 + i, Protocol: 'TCP' }],
      Selector: { app: `app-${i}` },
      CreationTimestamp: new Date(Date.now() - i * 1000 * 60).toISOString(),
      ApplicationOwner: '',
      Applications: [{ Name: `app-${i}` }],
    };
  });
}

const mockServices = createMockServices(4);

const mockNamespaces = [
  {
    Name: 'default',
    IsSystem: false,
    Status: 'Active',
    CreationTimestamp: '2024-01-01T00:00:00Z',
  },
  {
    Name: 'kube-system',
    IsSystem: true,
    Status: 'Active',
    CreationTimestamp: '2024-01-01T00:00:00Z',
  },
  {
    Name: 'my-namespace',
    IsSystem: false,
    Status: 'Active',
    CreationTimestamp: '2024-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  server.use(
    http.get('/api/kubernetes/1/services', () =>
      HttpResponse.json(mockServices)
    ),
    http.get('/api/kubernetes/1/namespaces', () =>
      HttpResponse.json(mockNamespaces)
    )
  );
});
const mockUser = {
  // Admin user
  ...createMockUsers(1, 1)[0],
};

function createTestComponent() {
  return withTestRouter(
    withUserProvider(withTestQueryProvider(ServicesDatatable), mockUser),
    {
      route: '/kubernetes/services',
      stateConfig: [
        {
          name: 'kubernetes.services',
          url: '/kubernetes/services',
          params: { endpointId: '1' },
        },
      ],
    }
  );
}

describe('ServicesDatatable', () => {
  it('renders services data correctly', async () => {
    const TestComponent = createTestComponent();
    render(<TestComponent />);

    expect(await screen.findByText('service-1')).toBeInTheDocument();
    expect(screen.getByText('service-2')).toBeInTheDocument();
  });

  it('should filter system resources correctly when toggled', async () => {
    const TestComponent = createTestComponent();
    render(<TestComponent />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await userEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.queryByText('service-0')).not.toBeInTheDocument();
    });

    const systemToggle = await screen.findByTestId('show-system-resources');
    await userEvent.click(systemToggle);

    await waitFor(() => {
      expect(screen.queryByText('service-0')).toBeInTheDocument();
    });

    expect(screen.getByText('service-3')).toBeInTheDocument();
    expect(screen.getByText('service-1')).toBeInTheDocument();
    expect(screen.getByText('service-2')).toBeInTheDocument();
  });

  it('should show loading state when data is loading', async () => {
    const TestComponent = createTestComponent();
    render(<TestComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
