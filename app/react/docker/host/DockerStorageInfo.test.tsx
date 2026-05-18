import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { EnvironmentType } from '@/react/portainer/environments/types';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { useDockerStorageUsageQuery } from '../queries/useDockerStorageUsageQuery';

import { DockerStorageInfo } from './DockerStorageInfo';

vi.mock('../queries/useDockerStorageUsageQuery', () => ({
  useDockerStorageUsageQuery: vi.fn(),
}));

vi.mock('@/react/portainer/environments/queries', () => ({
  useEnvironment: vi.fn(),
}));

// Tippy renders tooltip content in a portal which is not accessible without
// user interaction in jsdom. Mock Tooltip to render its message inline so
// tests can assert on the message text.
vi.mock('@@/Tip/Tooltip/Tooltip', () => ({
  Tooltip: ({ message }: { message: ReactNode }) => (
    <span data-cy="tooltip">{message}</span>
  ),
}));

const Wrapped = withTestQueryProvider(() => (
  <DockerStorageInfo endpointId={1} />
));

function mockEnvironmentLoading() {
  vi.mocked(useEnvironment).mockReturnValue({
    isLoading: true,
    isFetched: false,
    data: undefined,
    isError: false,
  } as ReturnType<typeof useEnvironment>);
}

function mockEnvironmentReady(
  agentVersion: string | undefined = '2.42.0',
  envType = EnvironmentType.AgentOnDocker
) {
  vi.mocked(useEnvironment).mockReturnValue({
    isLoading: false,
    isFetched: true,
    isError: false,
    data: {
      Type: envType,
      Agent: { Version: agentVersion },
    },
  } as ReturnType<typeof useEnvironment>);
}

function mockEnvironmentNoData() {
  vi.mocked(useEnvironment).mockReturnValue({
    isLoading: false,
    isFetched: true,
    isError: false,
    data: undefined,
  } as ReturnType<typeof useEnvironment>);
}

function mockStorageLoading() {
  vi.mocked(useDockerStorageUsageQuery).mockReturnValue({
    isLoading: true,
    isFetched: false,
    isError: false,
    data: undefined,
  } as ReturnType<typeof useDockerStorageUsageQuery>);
}

function mockStorageIdle() {
  vi.mocked(useDockerStorageUsageQuery).mockReturnValue({
    isLoading: false,
    isFetched: false,
    isError: false,
    data: undefined,
  } as ReturnType<typeof useDockerStorageUsageQuery>);
}

function mockStorageError(message = 'connection refused') {
  vi.mocked(useDockerStorageUsageQuery).mockReturnValue({
    isLoading: false,
    isFetched: true,
    isError: true,
    error: new Error(message),
    data: undefined,
  } as ReturnType<typeof useDockerStorageUsageQuery>);
}

function mockStorageNoData() {
  vi.mocked(useDockerStorageUsageQuery).mockReturnValue({
    isLoading: false,
    isFetched: true,
    isError: false,
    data: undefined,
  } as ReturnType<typeof useDockerStorageUsageQuery>);
}

const MOCK_STORAGE = {
  rootDir: '/var/lib/docker',
  totalBytes: 500_000_000,
  dockerBytes: 100_000_000,
  availableBytes: 300_000_000,
  imageBytes: 60_000_000,
  containerBytes: 20_000_000,
  volumeBytes: 15_000_000,
  buildCacheBytes: 5_000_000,
};

function mockStorageSuccess(data = MOCK_STORAGE) {
  vi.mocked(useDockerStorageUsageQuery).mockReturnValue({
    isLoading: false,
    isFetched: true,
    isError: false,
    data,
  } as ReturnType<typeof useDockerStorageUsageQuery>);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('DockerStorageInfo', () => {
  describe('loading state', () => {
    it('shows loading text while environment is loading', () => {
      mockEnvironmentLoading();
      mockStorageIdle();

      render(<Wrapped />);

      expect(screen.getByText('Loading storage information...')).toBeVisible();
    });

    it('shows loading text while storage query is loading', () => {
      mockEnvironmentReady();
      mockStorageLoading();

      render(<Wrapped />);

      expect(screen.getByText('Loading storage information...')).toBeVisible();
    });
  });

  describe('error state', () => {
    it('shows "Not available" when storage query fails', () => {
      mockEnvironmentReady();
      mockStorageError('Unable to connect to agent');

      render(<Wrapped />);

      expect(screen.getByText('Not available')).toBeVisible();
    });

    it('displays the error message in the tooltip', () => {
      mockEnvironmentReady();
      mockStorageError('Unable to connect to agent');

      render(<Wrapped />);

      expect(
        screen.getByText('Unable to connect to agent')
      ).toBeInTheDocument();
    });
  });

  describe('agent upgrade required', () => {
    it('shows "Not available" when agent version is older than required', () => {
      mockEnvironmentReady('2.39.0');
      mockStorageIdle();

      render(<Wrapped />);

      expect(screen.getByText('Not available')).toBeVisible();
    });

    it('shows "Not available" when agent version is missing (pre-2.15 agent)', () => {
      mockEnvironmentReady(undefined);
      mockStorageIdle();

      render(<Wrapped />);

      expect(screen.getByText('Not available')).toBeVisible();
    });

    it('shows upgrade tooltip message', () => {
      mockEnvironmentReady('2.39.0');
      mockStorageError();

      render(<Wrapped />);

      expect(
        screen.getByText(/Upgrade your agent to enable this feature/i)
      ).toBeInTheDocument();
    });
  });

  describe('storage unavailable (no data from agent)', () => {
    it('shows "Not available" when agent returns 204 (totalBytes undefined)', () => {
      mockEnvironmentReady();
      mockStorageNoData();

      render(<Wrapped />);

      expect(screen.getByText('Not available')).toBeVisible();
    });

    it('shows Docker socket tooltip message', () => {
      mockEnvironmentReady();
      mockStorageNoData();

      render(<Wrapped />);

      expect(
        screen.getByText(/Docker socket and host filesystem are accessible/i)
      ).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('renders the complete storage breakdown', () => {
      mockEnvironmentReady();
      mockStorageSuccess();

      render(<Wrapped />);

      // Legend items with humanized sizes
      // Use exact match for Docker to avoid matching the partition path "/var/lib/docker"
      expect(screen.getByText('Docker (100 MB)')).toBeVisible();
      expect(screen.getByText(/Other/i)).toBeVisible();
      expect(screen.getByText(/Free/i)).toBeVisible();

      // Partition
      expect(screen.getByText(/Partition:/i)).toBeVisible();
      expect(screen.getByText('/var/lib/docker')).toBeVisible();

      expect(screen.queryByText('Not available')).not.toBeInTheDocument();
    });

    it('shows Docker artifact breakdown in the tooltip', () => {
      mockEnvironmentReady();
      mockStorageSuccess();

      render(<Wrapped />);

      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Containers')).toBeInTheDocument();
      expect(screen.getByText('Volumes')).toBeInTheDocument();
      expect(screen.getByText('Build cache')).toBeInTheDocument();
    });
  });

  describe('no environment data', () => {
    it('shows "Not available" when environment data is missing after loading', () => {
      mockEnvironmentNoData();
      // When environment has no data, needsUpgrade will be true (no agentVersion),
      // so dockerStorage query won't run. Simulate it returning no data.
      mockStorageNoData();

      render(<Wrapped />);

      expect(screen.getByText('Not available')).toBeVisible();
    });
  });
});
