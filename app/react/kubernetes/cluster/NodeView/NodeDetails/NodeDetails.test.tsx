import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';
import { useAuthorizations } from '@/react/hooks/useUser';
import { select } from '@/react/test-utils/react-select';

import { confirmUpdateNode } from '../ConfirmUpdateNode';

import { NodeDetails } from './NodeDetails';

// Mocks
vi.mock('../ConfirmUpdateNode', () => ({
  confirmUpdateNode: vi.fn(),
}));
vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
}));
vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => {
    const actual = await importOriginal();
    return {
      ...actual,
      useAuthorizations: vi.fn(),
    };
  }
);
vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1, name: 'test-node' },
  })),
}));

// Sample test data
const mockNode = {
  metadata: {
    name: 'test-node',
    labels: {
      'kubernetes.io/hostname': 'test-node',
      'node-role.kubernetes.io/control-plane': '',
      'custom-label': 'custom-value',
    },
  },
  spec: {
    taints: [
      {
        key: 'node-role.kubernetes.io/control-plane',
        effect: 'NoSchedule',
        value: '',
      },
    ],
    unschedulable: false,
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'True',
      },
    ],
    allocatable: {
      memory: '2Gi',
      cpu: '2',
    },
  },
};

const mockNodes = [
  mockNode,
  {
    metadata: { name: 'node-2' },
    spec: { unschedulable: false },
    status: {
      conditions: [{ type: 'Ready', status: 'True' }],
      allocatable: {
        memory: '2Gi',
        cpu: '2',
      },
    },
  },
];

const mockApplications = [
  {
    Name: 'test-app',
    Namespace: 'default',
  },
];

const mockPortainerApplications = [
  {
    Name: 'portainer',
    Namespace: 'portainer',
  },
];

const mockEndpoints: unknown[] = [];

function setupMocks({
  applications = mockApplications,
  nodes = mockNodes,
  hasWriteAccess = true,
} = {}) {
  vi.mocked(useAuthorizations).mockReturnValue({
    authorized: hasWriteAccess,
    isLoading: false,
  });

  server.use(
    http.get('/api/endpoints/1/kubernetes/api/v1/nodes/test-node', () =>
      HttpResponse.json(mockNode)
    ),
    http.get('/api/endpoints/1/kubernetes/api/v1/nodes', () =>
      HttpResponse.json({ items: nodes })
    ),
    http.get('/api/kubernetes/1/applications', () =>
      HttpResponse.json(applications)
    ),
    http.get('/api/endpoints/1/kubernetes/api/v1/endpoints', () =>
      HttpResponse.json({ items: mockEndpoints })
    ),
    http.patch('/api/endpoints/1/kubernetes/api/v1/nodes/test-node', () =>
      HttpResponse.json(mockNode)
    ),
    http.post('/api/endpoints/1/kubernetes/api/v1/nodes/test-node/drain', () =>
      HttpResponse.json({})
    ),
    http.get('/api/kubernetes/1/metrics/nodes/test-node', () =>
      HttpResponse.json({
        usage: {
          memory: '1000000000',
          cpu: '1000m',
        },
      })
    ),
    http.get('/api/kubernetes/1/metrics/applications_resources', () =>
      HttpResponse.json({
        MemoryRequest: 500000000,
        CpuRequest: 500,
      })
    )
  );
}

function renderComponent() {
  const user = new UserViewModel({ Username: 'admin' });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <NodeDetails nodeName="test-node" environmentId={1} />
      )),
      user
    )
  );

  return render(<Wrapped />);
}

describe('NodeDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('shows drain warning when selecting Drain availability', async () => {
    renderComponent();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    // Find the availability select and select Drain
    const availabilitySelect = screen.getByLabelText('Availability');
    await select(availabilitySelect, 'Drain');

    // Try to submit the form to trigger validation
    const submitButton = screen.getByRole('button', { name: /update node/i });
    await userEvent.click(submitButton);

    // Check that the confirmation modal is called with drain warning
    await waitFor(() => {
      expect(vi.mocked(confirmUpdateNode)).toHaveBeenCalledWith(
        false, // taintsWarning
        false, // labelsWarning
        false, // cordonWarning
        true // drainWarning
      );
    });
  });

  it('prevents submission when Portainer is running on node', async () => {
    setupMocks({ applications: mockPortainerApplications });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    const availabilitySelect = screen.getByLabelText('Availability');
    await select(availabilitySelect, 'Drain');

    await waitFor(() => {
      expect(
        screen.getByText(/cannot drain node where.*portainer.*running/i)
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update node/i });
    expect(submitButton).toBeDisabled();
  });

  it('prevents drain when only one node in cluster', async () => {
    setupMocks({ nodes: [mockNode] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    const availabilitySelect = screen.getByLabelText('Availability');
    await select(availabilitySelect, 'Drain');

    await waitFor(() => {
      expect(
        screen.getByText(/cannot drain.*only node.*cluster/i)
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update node/i });
    expect(submitButton).toBeDisabled();
  });

  it('prevents drain when another node is already draining', async () => {
    const drainingNodes = [
      mockNode,
      {
        ...mockNodes[1],
        metadata: {
          ...mockNodes[1].metadata,
          labels: {
            'io.portainer/node-status-drain': '',
          },
        },
        spec: { unschedulable: true },
      },
    ];
    setupMocks({ nodes: drainingNodes });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    const availabilitySelect = screen.getByLabelText('Availability');
    await select(availabilitySelect, 'Drain');

    await waitFor(() => {
      expect(
        screen.getByText(/cannot drain.*another node.*currently.*drained/i)
      ).toBeInTheDocument();
    });
  });

  it('shows cordon warning when submitting with Pause availability', async () => {
    vi.mocked(confirmUpdateNode).mockResolvedValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    const availabilitySelect = screen.getByLabelText('Availability');
    await select(availabilitySelect, 'Pause');

    const submitButton = screen.getByRole('button', { name: /update node/i });
    await userEvent.click(submitButton);

    // Verify confirmation modal was called with cordon warning
    await waitFor(() => {
      expect(vi.mocked(confirmUpdateNode)).toHaveBeenCalledWith(
        false, // taintsWarning
        false, // labelsWarning
        true, // cordonWarning
        false // drainWarning
      );
    });
  });

  it('does not show form actions when user lacks write access', async () => {
    setupMocks({ hasWriteAccess: false });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    // Form actions should not be present
    expect(
      screen.queryByRole('button', { name: /update node/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument();
  });
});
