import { render, screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server, http } from '@/setup-tests/server';
import {
  createMockEnvironment,
  createMockQueryResult,
} from '@/react-tools/test-mocks';

import { ClusterResourceReservation } from './ClusterResourceReservation';

const mockUseAuthorizations = vi.fn();
const mockUseEnvironmentId = vi.fn(() => 3);
const mockUseCurrentEnvironment = vi.fn();

// Set up mock implementations for hooks
vi.mock('@/react/hooks/useUser', () => ({
  useAuthorizations: () => mockUseAuthorizations(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/hooks/useCurrentEnvironment', () => ({
  useCurrentEnvironment: () => mockUseCurrentEnvironment(),
}));

function renderComponent() {
  const Wrapped = withTestQueryProvider(ClusterResourceReservation);
  return render(<Wrapped />);
}

describe('ClusterResourceReservation', () => {
  beforeEach(() => {
    // Set the return values for the hooks
    mockUseAuthorizations.mockReturnValue({
      authorized: true,
      isLoading: false,
    });

    mockUseEnvironmentId.mockReturnValue(3);

    const mockEnvironment = createMockEnvironment();
    mockEnvironment.Kubernetes.Configuration.UseServerMetrics = true;
    mockUseCurrentEnvironment.mockReturnValue(
      createMockQueryResult(mockEnvironment)
    );

    // Setup default mock responses
    server.use(
      http.get('/api/endpoints/3/kubernetes/api/v1/nodes', () =>
        HttpResponse.json({
          items: [
            {
              status: {
                allocatable: {
                  cpu: '4',
                  memory: '8Gi',
                },
              },
            },
          ],
        })
      ),
      http.get('/api/kubernetes/3/metrics/nodes', () =>
        HttpResponse.json({
          items: [
            {
              usage: {
                cpu: '2',
                memory: '4Gi',
              },
            },
          ],
        })
      ),
      http.get('/api/kubernetes/3/metrics/applications_resources', () =>
        HttpResponse.json({
          CpuRequest: 1,
          MemoryRequest: '2Gi',
        })
      )
    );
  });

  it('should display resource limits, reservations and usage when all APIs respond successfully', async () => {
    renderComponent();

    expect(
      await within(await screen.findByTestId('memory-reservation')).findByText(
        '2048 / 8192 MiB - 25%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('memory-usage')).findByText(
        '4096 / 8192 MiB - 50%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('cpu-reservation')).findByText(
        '1 / 4 - 25%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('cpu-usage')).findByText(
        '2 / 4 - 50%'
      )
    ).toBeVisible();
  });

  it('should not display resource usage if user does not have K8sClusterNodeR authorization', async () => {
    mockUseAuthorizations.mockReturnValue({
      authorized: false,
      isLoading: false,
    });

    renderComponent();

    // Should only show reservation bars
    expect(
      await within(await screen.findByTestId('memory-reservation')).findByText(
        '2048 / 8192 MiB - 25%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('cpu-reservation')).findByText(
        '1 / 4 - 25%'
      )
    ).toBeVisible();

    // Usage bars should not be present
    expect(screen.queryByTestId('memory-usage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cpu-usage')).not.toBeInTheDocument();
  });

  it('should not display resource usage if metrics server is not enabled', async () => {
    const disabledMetricsEnvironment = createMockEnvironment();
    disabledMetricsEnvironment.Kubernetes.Configuration.UseServerMetrics =
      false;
    mockUseCurrentEnvironment.mockReturnValue(
      createMockQueryResult(disabledMetricsEnvironment)
    );

    renderComponent();

    // Should only show reservation bars
    expect(
      await within(await screen.findByTestId('memory-reservation')).findByText(
        '2048 / 8192 MiB - 25%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('cpu-reservation')).findByText(
        '1 / 4 - 25%'
      )
    ).toBeVisible();

    // Usage bars should not be present
    expect(screen.queryByTestId('memory-usage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cpu-usage')).not.toBeInTheDocument();
  });

  it('should display warning if metrics server is enabled but usage query fails', async () => {
    server.use(
      http.get('/api/kubernetes/3/metrics/nodes', () => HttpResponse.error())
    );

    // Mock console.error so test logs are not polluted
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent();

    expect(
      await within(await screen.findByTestId('memory-reservation')).findByText(
        '2048 / 8192 MiB - 25%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('memory-usage')).findByText(
        '0 / 8192 MiB - 0%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('cpu-reservation')).findByText(
        '1 / 4 - 25%'
      )
    ).toBeVisible();

    expect(
      await within(await screen.findByTestId('cpu-usage')).findByText(
        '0 / 4 - 0%'
      )
    ).toBeVisible();

    // Should show the warning message
    expect(
      await screen.findByText(
        /Resource usage is not currently available as Metrics Server is not responding/
      )
    ).toBeVisible();

    // Restore console.error
    vi.spyOn(console, 'error').mockRestore();
  });
});
