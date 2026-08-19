import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';

import { Chart } from '../types';

import { HelmInstallForm } from './HelmInstallForm';

const mockNotifySuccess = vi.fn();
const mockRouterGo = vi.fn();

// Mock the router hook to provide endpointId
vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
  useRouter: vi.fn(() => ({
    stateService: {
      go: vi.fn((...args) => mockRouterGo(...args)),
    },
  })),
}));

// Mock dependencies
vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn((title: string, text: string) =>
    mockNotifySuccess(title, text)
  ),
}));

vi.mock('@@/modals/confirm', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  confirmGenericDiscard: vi.fn().mockResolvedValue(true),
}));

// Sample test data
const mockChart: Chart = {
  name: 'test-chart',
  description: 'Test Chart Description',
  repo: 'https://example.com',
  icon: 'test-icon-url',
  annotations: {
    category: 'database',
  },
  version: '1.0.1',
  versions: ['1.0.0', '1.0.1'],
};

function renderComponent({
  selectedChart = mockChart,
  namespace = 'test-namespace',
  name = 'test-name',
  isAdmin = true,
} = {}) {
  server.use(
    http.get('/api/templates/helm', () =>
      HttpResponse.json({
        entries: {
          'test-chart': [
            { version: '1.0.0', appVersion: '1.0.0' },
            { version: '0.9.0', appVersion: '0.9.0' },
          ],
        },
      })
    ),
    http.post('/api/endpoints/:endpointId/kubernetes/helm', () =>
      HttpResponse.json({})
    )
  );

  const user = new UserViewModel({ Username: 'user', Role: isAdmin ? 1 : 2 });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <HelmInstallForm
          selectedChart={selectedChart}
          namespace={namespace}
          name={name}
          isRepoAvailable
        />
      )),
      user
    )
  );

  return render(<Wrapped />);
}

describe('HelmInstallForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not display any visible error messages on initial load', async () => {
    renderComponent({ namespace: '' });

    await waitFor(() => {
      // Check that no error messages (role="alert") are visible
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('should render the form with version selector and values editor', async () => {
    renderComponent();

    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Install')).toBeInTheDocument();
  });

  it('should install helm chart when install button is clicked', async () => {
    const user = userEvent.setup();
    let capturedBody: unknown = null;

    renderComponent();

    server.use(
      http.post(
        '/api/endpoints/:endpointId/kubernetes/helm',
        async ({ request }) => {
          const url = new URL(request.url);
          if (!url.searchParams.get('dryRun')) {
            capturedBody = await request.json();
          }
          return HttpResponse.json({});
        }
      )
    );

    await screen.findByText('1.0.0 (latest)');
    await user.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        name: 'test-name',
        repo: 'https://example.com',
        chart: 'test-chart',
        values: '',
        namespace: 'test-namespace',
        version: '1.0.0',
      });
    });
  });

  it('should disable install button when namespace or name is undefined', () => {
    renderComponent({ namespace: '' });
    expect(screen.getByText('Install')).toBeDisabled();
  });

  it('should call success handlers when installation succeeds', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByText('1.0.0 (latest)');
    await user.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(mockNotifySuccess).toHaveBeenCalledWith(
        'Success',
        'Helm chart successfully installed'
      );
      expect(mockRouterGo).toHaveBeenCalledWith('kubernetes.applications');
    });
  });
});
