import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import {
  useHelmRepoVersions,
  ChartVersion,
} from '../../helmChartSourceQueries/useHelmRepoVersions';
import { HelmRelease } from '../../types';

import { openUpgradeHelmModal } from './UpgradeHelmModal';
import { UpgradeButton } from './UpgradeButton';

// Mock the upgrade modal function
vi.mock('./UpgradeHelmModal', () => ({
  openUpgradeHelmModal: vi.fn(() => Promise.resolve(undefined)),
}));

// Mock the notifications service
vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
}));

vi.mock('../../helmChartSourceQueries/useHelmRepositories', async () => {
  const actual = await vi.importActual(
    '../../helmChartSourceQueries/useHelmRepositories'
  );
  return {
    ...actual,
    useUserHelmRepositories: vi.fn(() => ({
      data: ['repo1', 'repo2'],
      isInitialLoading: false,
      isError: false,
    })),
  };
});

vi.mock('../../helmChartSourceQueries/useHelmRepoVersions', async () => {
  const actual = await vi.importActual(
    '../../helmChartSourceQueries/useHelmRepoVersions'
  );
  return {
    ...actual,
    useHelmRepoVersions: vi.fn(),
  };
});

// Mock the useHelmRelease hook
vi.mock('../../helmReleaseQueries/useHelmRelease', async () => {
  const actual = await vi.importActual(
    '../../helmReleaseQueries/useHelmRelease'
  );
  return {
    ...actual,
    useHelmRelease: vi.fn(() => ({
      data: '1.0.0',
    })),
  };
});

// Mock the useUpdateHelmReleaseMutation hook
vi.mock('../../helmReleaseQueries/useUpdateHelmReleaseMutation', async () => {
  const actual = await vi.importActual(
    '../../helmReleaseQueries/useUpdateHelmReleaseMutation'
  );
  return {
    ...actual,
    useUpdateHelmReleaseMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
    })),
  };
});

function renderButton(props = {}) {
  const defaultProps = {
    environmentId: 1,
    releaseName: 'test-release',
    namespace: 'default',
    release: {
      name: 'test-release',
      chart: {
        metadata: {
          name: 'test-chart',
          version: '1.0.0',
        },
      },
      values: {
        userSuppliedValues: '{}',
      },
      manifest: '',
    } as HelmRelease,
    updateRelease: vi.fn(),
    ...props,
  };

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(UpgradeButton))
  );
  return render(<Wrapped {...defaultProps} />);
}

describe('UpgradeButton', () => {
  beforeEach(() => {
    // Set up default mock return values
    vi.mocked(useHelmRepoVersions).mockReturnValue({
      data: [
        { Version: '1.0.0', Repo: 'stable' },
        { Version: '1.1.0', Repo: 'stable' },
      ],
      isInitialLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(() => Promise.resolve([])),
    });
  });

  test('should display the upgrade button', () => {
    renderButton();

    const button = screen.getByRole('button', { name: /Upgrade/i });
    expect(button).toBeInTheDocument();
  });

  test('should be disabled when no versions are available', () => {
    const data: ChartVersion[] = [];
    vi.mocked(useHelmRepoVersions).mockReturnValue({
      data,
      isInitialLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(() => Promise.resolve([])),
    });

    renderButton();

    const button = screen.getByRole('button', { name: /Upgrade/i });
    expect(button).toBeDisabled();
  });

  test('should show loading state when checking for versions', () => {
    vi.mocked(useHelmRepoVersions).mockReturnValue({
      data: [],
      isInitialLoading: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(() => Promise.resolve([])),
    });

    renderButton();

    expect(
      screen.getByText('Checking for new versions...')
    ).toBeInTheDocument();
  });

  test('should show "No versions available" when no versions are found', () => {
    const data: ChartVersion[] = [];
    vi.mocked(useHelmRepoVersions).mockReturnValue({
      data,
      isInitialLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(() => Promise.resolve([])),
    });

    renderButton();

    expect(screen.getByText(/No versions available/)).toBeInTheDocument();
  });

  test('should open upgrade modal when clicked', async () => {
    const user = userEvent.setup();
    const mockRelease = {
      name: 'test-release',
      chart: {
        metadata: {
          name: 'test-chart',
          version: '1.0.0',
          appVersion: '1.0.0',
        },
      },
      values: {
        userSuppliedValues: '{}',
      },
      manifest: '',
      namespace: 'default',
    } as HelmRelease;

    vi.mocked(useHelmRepoVersions).mockReturnValue({
      data: [
        { Version: '1.0.0', Repo: 'stable' },
        { Version: '1.1.0', Repo: 'stable' },
      ],
      isInitialLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(() => Promise.resolve([])),
    });

    renderButton({ release: mockRelease });

    const button = screen.getByRole('button', { name: /Upgrade/i });
    await user.click(button);

    await waitFor(() => {
      expect(openUpgradeHelmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-release',
          chart: 'test-chart',
          namespace: 'default',
          values: '{}',
          version: '1.0.0',
        }),
        expect.arrayContaining([
          { Version: '1.0.0', Repo: 'stable' },
          { Version: '1.1.0', Repo: 'stable' },
        ]),
        '', // releaseManifest
        1 // environmentId
      );
    });
  });

  test('should not execute the upgrade if modal is cancelled', async () => {
    const mockUpdateRelease = vi.fn();
    vi.mocked(openUpgradeHelmModal).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    renderButton({ updateRelease: mockUpdateRelease });

    const button = screen.getByRole('button', { name: /Upgrade/i });
    await user.click(button);

    await waitFor(() => {
      expect(openUpgradeHelmModal).toHaveBeenCalled();
    });

    expect(mockUpdateRelease).not.toHaveBeenCalled();
  });
});
