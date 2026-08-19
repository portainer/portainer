import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import _ from 'lodash';
import { http, HttpResponse } from 'msw';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { ContainerEngine } from '@/react/portainer/environments/types';
import { server } from '@/setup-tests/server';
import {
  createMockEnvironment,
  createMockUser,
} from '@/react-tools/test-mocks';

import { ContainerActionsSection } from './ContainerActionsSection';

const mockStartMutate = vi.fn();
const mockStopMutate = vi.fn();
const mockKillMutate = vi.fn();
const mockRestartMutate = vi.fn();
const mockPauseMutate = vi.fn();
const mockUnpauseMutate = vi.fn();
const mockRemoveMutate = vi.fn();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 }, // Must match environmentId in test props and user authorizations
  })),
}));

vi.mock('./queries/useStartContainer', () => ({
  useStartContainer: () => ({ mutate: mockStartMutate, isLoading: false }),
}));

vi.mock('./queries/useStopContainer', () => ({
  useStopContainer: () => ({ mutate: mockStopMutate, isLoading: false }),
}));

vi.mock('./queries/useKillContainer', () => ({
  useKillContainer: () => ({ mutate: mockKillMutate, isLoading: false }),
}));

vi.mock('./queries/useRestartContainer', () => ({
  useRestartContainer: () => ({ mutate: mockRestartMutate, isLoading: false }),
}));

vi.mock('./queries/usePauseContainer', () => ({
  usePauseContainer: () => ({ mutate: mockPauseMutate, isLoading: false }),
}));

vi.mock('./queries/useResumeContainer', () => ({
  useResumeContainer: () => ({ mutate: mockUnpauseMutate, isLoading: false }),
}));

vi.mock('./queries/useRemoveContainer', () => ({
  useRemoveContainer: () => ({ mutate: mockRemoveMutate, isLoading: false }),
}));

vi.mock('@/react/docker/proxy/queries/useInfo', () => ({
  useIsSwarm: () => false,
}));

const mockConfirmContainerDeletion = vi.fn();
vi.mock(
  '@/react/docker/containers/common/confirm-container-delete-modal',
  () => ({
    confirmContainerDeletion: (title: string) =>
      mockConfirmContainerDeletion(title),
  })
);

describe('ContainerActionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup MSW handler for environment endpoint
    server.use(
      http.get('/api/endpoints/:id', () =>
        HttpResponse.json(
          createMockEnvironment({
            Id: 1,
            ContainerEngine: ContainerEngine.Docker,
            SecuritySettings: {
              allowContainerCapabilitiesForRegularUsers: true,
              allowBindMountsForRegularUsers: true,
              allowDeviceMappingForRegularUsers: true,
              allowSysctlSettingForRegularUsers: true,
              allowHostNamespaceForRegularUsers: true,
              allowPrivilegedModeForRegularUsers: true,
              allowVolumeBrowserForRegularUsers: true,
              allowStackManagementForRegularUsers: true,
              allowSecurityOptForRegularUsers: true,
              enableHostManagementFeatures: false,
            },
          })
        )
      )
    );
  });

  it('should render all action buttons when authorized', async () => {
    renderComponent();

    // Wait for environment data to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start' })).toBeVisible();
    });

    expect(screen.getByRole('button', { name: 'Stop' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Kill' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  it('should disable start button when container is running', async () => {
    renderComponent({
      container: mockContainer({
        Id: 'test-container-id',
        State: { Running: true, Paused: false },
        Config: { Image: 'nginx:latest' },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    });
  });

  it('should disable stop, kill, restart buttons when container is not running', async () => {
    renderComponent({
      container: mockContainer({
        Id: 'test-container-id',
        State: { Running: false, Paused: false },
        Config: { Image: 'nginx:latest' },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Kill' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled();
  });

  it('should disable pause button when container is paused', async () => {
    renderComponent({
      container: mockContainer({
        Id: 'test-container-id',
        State: { Running: true, Paused: true },
        Config: { Image: 'nginx:latest' },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    });
  });

  it('should disable unpause button when container is not paused', async () => {
    renderComponent({
      container: mockContainer({
        Id: 'test-container-id',
        State: { Running: true, Paused: false },
        Config: { Image: 'nginx:latest' },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Resume' })).toBeDisabled();
    });
  });

  it('should disable all buttons when container is Portainer', async () => {
    renderComponent({
      container: mockContainer({
        Id: 'test-container-id',
        State: { Running: true, Paused: false },
        Config: { Image: 'portainer:latest' },
        IsPortainer: true,
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Kill' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  it('should call start mutation when start button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const startButton = await screen.findByRole('button', { name: 'Start' });
    await user.click(startButton);

    expect(mockStartMutate).toHaveBeenCalledWith(
      {
        environmentId: 1,
        containerId: 'test-container-id',
        nodeName: 'node1',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
  });

  it('should call stop mutation when stop button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({
      container: mockContainer({
        Id: 'test-container-id',
        State: { Running: true, Paused: false },
        Config: { Image: 'nginx:latest' },
      }),
    });

    const stopButton = await screen.findByRole('button', { name: 'Stop' });
    await user.click(stopButton);

    expect(mockStopMutate).toHaveBeenCalledWith(
      {
        environmentId: 1,
        containerId: 'test-container-id',
        nodeName: 'node1',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
  });

  it('should show confirmation modal and call remove mutation when confirmed', async () => {
    const user = userEvent.setup();
    mockConfirmContainerDeletion.mockResolvedValue({ removeVolumes: true });

    renderComponent();

    const removeButton = await screen.findByRole('button', { name: 'Remove' });
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockConfirmContainerDeletion).toHaveBeenCalledWith(
        'You are about to remove a container.'
      );
    });

    await waitFor(() => {
      expect(mockRemoveMutate).toHaveBeenCalledWith(
        {
          environmentId: 1,
          containerId: 'test-container-id',
          nodeName: 'node1',
          removeVolumes: true,
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  it('should not call remove mutation when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirmContainerDeletion.mockResolvedValue(undefined);

    renderComponent();

    const removeButton = await screen.findByRole('button', { name: 'Remove' });
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockConfirmContainerDeletion).toHaveBeenCalled();
    });

    expect(mockRemoveMutate).not.toHaveBeenCalled();
  });
});

function renderComponent(
  props: Partial<React.ComponentProps<typeof ContainerActionsSection>> & {
    userAuthorizations?: Record<string, boolean>;
  } = {}
) {
  const { userAuthorizations, ...componentProps } = props;

  const defaultProps: React.ComponentProps<typeof ContainerActionsSection> = {
    environmentId: 1,
    nodeName: 'node1',
    container: mockContainer(),
    ...componentProps,
  };

  const defaultAuthorizations = {
    DockerContainerStart: true,
    DockerContainerStop: true,
    DockerContainerKill: true,
    DockerContainerRestart: true,
    DockerContainerPause: true,
    DockerContainerUnpause: true,
    DockerContainerDelete: true,
    DockerContainerCreate: true,
  };

  const mockUser = createMockUser({
    EndpointAuthorizations: {
      1: userAuthorizations || defaultAuthorizations,
    },
    Id: 1,
    Role: 1,
  });

  const Wrapper = withTestQueryProvider(
    withUserProvider(withTestRouter(ContainerActionsSection), mockUser)
  );

  return render(<Wrapper {...defaultProps} />);
}

function mockContainer(
  overrides: Partial<ContainerDetailsViewModel> = {}
): ContainerDetailsViewModel {
  return _.merge(
    {
      Id: 'test-container-id',
      State: {
        Running: false,
        Paused: false,
      },
      Config: {
        Image: 'nginx:latest',
      },
      IsPortainer: false,
    } as ContainerDetailsViewModel,
    overrides
  );
}
