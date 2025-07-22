import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';

import { Chart } from '../types';

import { HelmInstallForm } from './HelmInstallForm';

const mockMutate = vi.fn();
const mockNotifySuccess = vi.fn();
const mockTrackEvent = vi.fn();
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

vi.mock('../helmReleaseQueries/useUpdateHelmReleaseMutation', () => ({
  useUpdateHelmReleaseMutation: vi.fn(() => ({
    mutateAsync: vi.fn((...args) => mockMutate(...args)),
    isLoading: false,
  })),
  updateHelmRelease: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../helmChartSourceQueries/useHelmRepoVersions', () => ({
  useHelmRepoVersions: vi.fn(() => ({
    data: [
      { Version: '1.0.0', AppVersion: '1.0.0' },
      { Version: '0.9.0', AppVersion: '0.9.0' },
    ],
    isInitialLoading: false,
  })),
}));

vi.mock('./queries/useHelmChartValues', () => ({
  useHelmChartValues: vi.fn().mockReturnValue({
    data: { values: 'test-values' },
    isInitialLoading: false,
  }),
}));

vi.mock('@/react/hooks/useAnalytics', () => ({
  useAnalytics: vi.fn().mockReturnValue({
    trackEvent: vi.fn((...args) => mockTrackEvent(...args)),
  }),
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

const mockRouterStateService = {
  go: vi.fn(),
};

function renderComponent({
  selectedChart = mockChart,
  namespace = 'test-namespace',
  name = 'test-name',
  isAdmin = true,
} = {}) {
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

  return {
    ...render(<Wrapped />),
    user,
    mockRouterStateService,
  };
}

describe('HelmInstallForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with version selector and values editor', async () => {
    renderComponent();

    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Install')).toBeInTheDocument();
  });

  it('should install helm chart when install button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const installButton = screen.getByText('Install');
    await user.click(installButton);

    // Check mutate was called with correct values
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-name',
        repo: 'https://example.com',
        chart: 'test-chart',
        values: '',
        namespace: 'test-namespace',
        version: '1.0.0',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('should disable install button when namespace or name is undefined', () => {
    renderComponent({ namespace: '' });
    expect(screen.getByText('Install')).toBeDisabled();
  });

  it('should call success handlers when installation succeeds', async () => {
    const user = userEvent.setup();
    renderComponent();

    const installButton = screen.getByText('Install');
    await user.click(installButton);

    // Get the onSuccess callback and call it
    const onSuccessCallback = mockMutate.mock.calls[0][1].onSuccess;
    onSuccessCallback();

    // Check that success handlers were called
    expect(mockTrackEvent).toHaveBeenCalledWith('kubernetes-helm-install', {
      category: 'kubernetes',
      metadata: {
        'chart-name': 'test-chart',
      },
    });
    expect(mockNotifySuccess).toHaveBeenCalledWith(
      'Success',
      'Helm chart successfully installed'
    );
    expect(mockRouterGo).toHaveBeenCalledWith('kubernetes.applications');
  });
});
