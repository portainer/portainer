import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import {
  Environment,
  EnvironmentType,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { ItemView } from './ItemView';

// Mock child components
vi.mock('./EdgeInformationPanel/EdgeInformationPanel', () => ({
  EdgeInformationPanel: ({
    environmentId,
    edgeKey,
    edgeId,
    platformName,
  }: {
    environmentId: number;
    edgeKey: string;
    edgeId: string;
    platformName: string;
  }) => (
    <div data-cy="edge-info-panel">
      EdgeInformationPanel: {environmentId}, {edgeKey}, {edgeId}, {platformName}
    </div>
  ),
}));

vi.mock('./EdgeAgentDeploymentWidget/EdgeAgentDeploymentWidget', () => ({
  EdgeAgentDeploymentWidget: ({
    edgeKey,
    edgeId,
    asyncMode,
  }: {
    edgeKey: string;
    edgeId?: string;
    asyncMode?: boolean;
  }) => (
    <div data-cy="edge-agent-deployment">
      EdgeAgentDeploymentWidget: {edgeKey}, {edgeId}, {asyncMode?.toString()}
    </div>
  ),
}));

vi.mock('./KubeConfigInfo/KubeConfigInfo', () => ({
  KubeConfigInfo: ({
    environmentId,
    environmentType,
    edgeId,
    status,
  }: {
    environmentId: number;
    environmentType: EnvironmentType;
    edgeId?: string;
    status: EnvironmentStatus;
  }) => (
    <div data-cy="kube-config-info">
      KubeConfigInfo: {environmentId}, {environmentType}, {edgeId}, {status}
    </div>
  ),
}));

vi.mock('./EnvironmentDetailsForm', () => ({
  EnvironmentDetailsForm: ({ environment }: { environment: Environment }) => (
    <div data-cy="environment-details-form">
      EnvironmentDetailsForm: {environment.Name}
    </div>
  ),
}));

// Mock useIdParam hook
vi.mock('@/react/hooks/useIdParam', () => ({
  useIdParam: () => 1,
}));

describe('ItemView', () => {
  it('should render page header with environment name and breadcrumbs', async () => {
    const { getByRole } = renderComponent();

    await waitFor(() => {
      expect(
        getByRole('heading', { name: 'Environment details' })
      ).toBeVisible();
    });

    // Check breadcrumbs are present
    expect(screen.getByText('Test Environment')).toBeVisible();
  });

  it('should render EdgeInformationPanel for edge environment with EdgeID', async () => {
    const environment = createMockEnvironment({
      Type: EnvironmentType.EdgeAgentOnDocker,
      EdgeID: 'edge-123',
      EdgeKey: 'edge-key-123',
    });

    renderComponentWithEnvironment(environment);

    await waitFor(() => {
      const edgeInfoPanel = screen.getByTestId('edge-info-panel');
      expect(edgeInfoPanel).toBeVisible();
      expect(edgeInfoPanel).toHaveTextContent('edge-key-123');
      expect(edgeInfoPanel).toHaveTextContent('edge-123');
    });
  });

  it('should render EdgeAgentDeploymentWidget for edge environment without EdgeID', async () => {
    const environment = createMockEnvironment({
      Type: EnvironmentType.EdgeAgentOnDocker,
      EdgeID: undefined,
      EdgeKey: 'edge-key-456',
      Edge: {
        AsyncMode: true,
        PingInterval: 30,
        SnapshotInterval: 60,
        CommandInterval: 10,
      },
    });

    renderComponentWithEnvironment(environment);

    await waitFor(() => {
      const deploymentWidget = screen.getByTestId('edge-agent-deployment');
      expect(deploymentWidget).toBeVisible();
      expect(deploymentWidget).toHaveTextContent('edge-key-456');
      expect(deploymentWidget).toHaveTextContent('true'); // AsyncMode
    });
  });

  it('should not render edge components for non-edge environment', async () => {
    const environment = createMockEnvironment({
      Type: EnvironmentType.Docker,
    });

    renderComponentWithEnvironment(environment);

    await waitFor(() => {
      expect(screen.getByTestId('kube-config-info')).toBeVisible();
    });

    expect(screen.queryByTestId('edge-info-panel')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('edge-agent-deployment')
    ).not.toBeInTheDocument();
  });

  it('should render KubeConfigInfo component', async () => {
    const environment = createMockEnvironment({
      Type: EnvironmentType.KubernetesLocal,
      Status: EnvironmentStatus.Up,
    });

    renderComponentWithEnvironment(environment);

    await waitFor(() => {
      const kubeConfigInfo = screen.getByTestId('kube-config-info');
      expect(kubeConfigInfo).toBeVisible();
      expect(kubeConfigInfo).toHaveTextContent('5'); // EnvironmentType.KubernetesLocal value
      expect(kubeConfigInfo).toHaveTextContent('1'); // Status: Up
    });
  });

  it('should render EnvironmentDetailsForm component', async () => {
    const { getByTestId } = renderComponent();

    await waitFor(() => {
      const detailsForm = getByTestId('environment-details-form');
      expect(detailsForm).toBeVisible();
      expect(detailsForm).toHaveTextContent('Test Environment');
    });
  });
});

function renderComponent() {
  const mockEnvironment = createMockEnvironment({
    Id: 1,
    Name: 'Test Environment',
    Type: EnvironmentType.Docker,
    Status: EnvironmentStatus.Up,
  });
  return renderComponentWithEnvironment(mockEnvironment);
}

function renderComponentWithEnvironment(environment: Environment) {
  server.use(
    http.get('/api/endpoints/:id', ({ params }) => {
      const { id } = params;
      return HttpResponse.json({
        ...environment,
        Id: Number(id),
      });
    })
  );

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ItemView))
  );

  return render(<Wrapped />);
}
