import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server, http } from '@/setup-tests/server';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { mockCodeMirror } from '@/setup-tests/mock-codemirror';
import { mockLocalizeDate } from '@/setup-tests/mock-localizeDate';

import { HelmApplicationView } from './HelmApplicationView';

// Mock the necessary hooks and dependencies
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

mockCodeMirror();

const minimalHelmRelease = {
  name: 'test-release',
  version: '1',
  namespace: 'default',
  chart: {
    metadata: {
      name: 'test-chart',
      version: '2.2.2',
    },
  },
  info: {
    status: 'deployed',
    last_deployed: '2021-01-01T00:00:00Z',
    // notes: 'This is a test note', // can be missing for a minimal release
  },
  manifest: 'This is a test manifest',
};

// Create a more complete helm release object for testing
const completeHelmRelease = {
  name: 'test-release',
  version: '1',
  namespace: 'default',
  chart: {
    metadata: {
      name: 'test-chart',
      appVersion: '1.0.0',
      version: '2.2.2',
    },
  },
  info: {
    status: 'deployed',
    notes: 'This is a test note',
    resources: [
      {
        kind: 'Deployment',
        name: 'test-deployment',
        namespace: 'default',
        uid: 'test-deployment-uid',
        status: {
          healthSummary: {
            status: 'Healthy',
            reason: 'Running',
            message: 'All replicas are ready',
          },
        },
        metadata: {
          name: 'test-deployment',
          namespace: 'default',
        },
      },
      {
        kind: 'Service',
        name: 'test-service',
        namespace: 'default',
        uid: 'test-service-uid',
        status: {
          healthSummary: {
            status: 'Healthy',
            reason: 'Available',
            message: 'Service is available',
          },
        },
        metadata: {
          name: 'test-service',
          namespace: 'default',
        },
      },
    ],
  },
  manifest: 'This is a test manifest',
  values: {
    // Add some values to ensure the Values tab is present
    replicaCount: 1,
    image: {
      repository: 'nginx',
      tag: 'latest',
    },
  },
  resources: [
    {
      kind: 'Deployment',
      name: 'test-deployment',
      namespace: 'default',
      status: {
        healthSummary: {
          status: 'Healthy',
          reason: 'Running',
          message: 'All replicas are ready',
        },
      },
      metadata: {
        name: 'test-deployment',
        namespace: 'default',
      },
    },
  ],
};

const helmReleaseHistory = [
  {
    version: 1,
    updated: '2023-06-01T12:00:00Z',
    status: 'deployed',
    chart: 'test-chart-1.0.0',
    app_version: '1.0.0',
    description: 'Install complete',
  },
];

// Common MSW handlers for all tests
function createCommonHandlers() {
  return [
    http.get('/api/users/undefined/helm/repositories', () =>
      HttpResponse.json({
        GlobalRepository: 'https://charts.helm.sh/stable',
        UserRepositories: [{ Id: '1', URL: 'https://charts.helm.sh/stable' }],
      })
    ),
    http.get('/api/templates/helm', () =>
      HttpResponse.json({
        entries: {
          'test-chart': [{ version: '1.0.0' }],
        },
      })
    ),
    http.get('/api/endpoints/3/kubernetes/helm/test-release/history', () =>
      HttpResponse.json(helmReleaseHistory)
    ),
    http.get('/api/kubernetes/3/namespaces', () =>
      HttpResponse.json([
        {
          Id: 'default',
          Name: 'default',
          Status: { phase: 'Active' },
          Annotations: null,
          CreationDate: '2021-01-01T00:00:00Z',
          NamespaceOwner: '',
          IsSystem: false,
          IsDefault: true,
        },
      ])
    ),
    http.get('/api/kubernetes/3/namespaces/default/events', () =>
      HttpResponse.json([])
    ),
    http.get('/api/kubernetes/3/namespaces/default', () =>
      HttpResponse.json({
        Id: 'default',
        Name: 'default',
        Status: { phase: 'Active' },
        Annotations: {},
        CreationDate: '2021-01-01T00:00:00Z',
        NamespaceOwner: '',
        IsSystem: false,
        IsDefault: true,
      })
    ),
  ];
}

function setupMockHandlers(helmReleaseHandler: ReturnType<typeof http.get>) {
  server.use(helmReleaseHandler, ...createCommonHandlers());
}

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(HelmApplicationView), user)
  );
  return render(<Wrapped />);
}

describe(
  'HelmApplicationView',
  () => {
    beforeEach(() => {
      // Set up default mock values
      mockUseEnvironmentId.mockReturnValue(3);
      mockUseCurrentStateAndParams.mockReturnValue({
        params: {
          name: 'test-release',
          namespace: 'default',
        },
      });
    });

    it('should display helm release details for minimal release when data is loaded', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      setupMockHandlers(
        http.get('/api/endpoints/3/kubernetes/helm/test-release', () =>
          HttpResponse.json(minimalHelmRelease)
        )
      );

      const { findByText, findAllByText } = renderComponent();

      // Check for the page header
      expect(await findByText('Helm details')).toBeInTheDocument();

      // Check for the badge content
      expect(await findByText(/Namespace: default/)).toBeInTheDocument();
      expect(
        await findByText(/Chart version: test-chart-2.2.2/)
      ).toBeInTheDocument();
      expect(await findByText(/Chart: test-chart/)).toBeInTheDocument();
      expect(await findByText(/Revision: #1/)).toBeInTheDocument();
      expect(
        await findByText(/Last deployed: Jan 1, 2021, 12:00 AM/)
      ).toBeInTheDocument();
      // Check for the actual values
      expect(await findAllByText(/test-release/)).toHaveLength(2); // title and badge
      expect(await findAllByText(/test-chart/)).toHaveLength(2); // title and badge (not checking revision list item)

      // There shouldn't be a notes tab when there are no notes
      expect(screen.queryByText(/Notes/)).not.toBeInTheDocument();

      // There shouldn't be an app version badge when it's missing
      expect(screen.queryByText(/App version/)).not.toBeInTheDocument();

      // Ensure there are no console errors
      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();

      // Restore console.error
      vi.spyOn(console, 'error').mockRestore();
    });

    it('should display error message when API request fails', async () => {
      // Mock API failure
      setupMockHandlers(
        http.get('/api/endpoints/3/kubernetes/helm/test-release', () =>
          HttpResponse.error()
        )
      );

      // Mock console.error to prevent test output pollution
      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent();

      // Wait for the error message to appear
      expect(
        await screen.findByText(
          'Failed to load Helm application details',
          {},
          { timeout: 6500 }
        )
      ).toBeInTheDocument();

      // Restore console.error
      vi.spyOn(console, 'error').mockRestore();
    });

    it('should display additional details when available in helm release', async () => {
      setupMockHandlers(
        http.get('/api/endpoints/3/kubernetes/helm/test-release', () =>
          HttpResponse.json(completeHelmRelease)
        )
      );

      const { findByText } = renderComponent();

      expect(await findByText('Helm details')).toBeInTheDocument();

      // Check for the app version badge when it's available
      await waitFor(() => {
        expect(
          screen.getByText(/App version/, { exact: false })
        ).toBeInTheDocument();
      });

      await waitFor(() => {
        // Look for specific tab text
        expect(screen.getByText('Resources')).toBeInTheDocument();
        expect(screen.getByText('Values')).toBeInTheDocument();
        expect(screen.getByText('Manifest')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
      });

      expect(await findByText(/App version: 1.0.0/)).toBeInTheDocument();
    });
  },
  {
    timeout: 7000,
  }
);
