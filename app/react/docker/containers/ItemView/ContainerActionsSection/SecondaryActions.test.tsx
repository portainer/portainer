import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { ContainerEngine } from '@/react/portainer/environments/types';
import { server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { SecondaryActions } from './SecondaryActions';

const mockRecreateMutate = vi.fn();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    stateService: {
      go: vi.fn(),
    },
  })),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 }, // Must match environmentId in test props and user authorizations
  })),
}));

vi.mock('./queries/useRecreateContainer', () => ({
  useRecreateContainer: () => ({
    mutate: mockRecreateMutate,
    isLoading: false,
  }),
}));

vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => {
    const actual = await importOriginal();
    return {
      ...actual,
      useIsEdgeAdmin: () => ({
        isAdmin: true,
      }),
    };
  }
);

vi.mock('@/react/docker/proxy/queries/useInfo', () => ({
  useIsSwarm: () => false,
}));

const mockConfirmContainerRecreation = vi.fn();
vi.mock('../ConfirmRecreationModal', () => ({
  confirmContainerRecreation: (cannotPullImage: boolean) =>
    mockConfirmContainerRecreation(cannotPullImage),
}));

describe('SecondaryActions', () => {
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

  it('should render component when authorized', async () => {
    renderComponent();

    // Wait for component to load environment data and render
    await waitFor(() => {
      expect(
        screen.getByTestId('recreate-container-button')
      ).toBeInTheDocument();
    });
  });

  it('should show recreate button for Docker containers', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('recreate-container-button')).toBeVisible();
    });
  });

  it('should show duplicate/edit button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByTestId('duplicate-edit-container-button')
      ).toBeVisible();
    });
  });

  it('should hide recreate button when container has AutoRemove enabled', () => {
    renderComponent({ containerAutoRemove: true });

    expect(
      screen.queryByTestId('recreate-container-button')
    ).not.toBeInTheDocument();
  });

  it('should show confirmation modal and call recreate mutation when confirmed', async () => {
    const user = userEvent.setup();
    mockConfirmContainerRecreation.mockResolvedValue({ pullLatest: true });

    renderComponent();

    const recreateButton = await screen.findByTestId(
      'recreate-container-button'
    );
    await user.click(recreateButton);

    await waitFor(() => {
      expect(mockConfirmContainerRecreation).toHaveBeenCalledWith(false);
    });

    await waitFor(() => {
      expect(mockRecreateMutate).toHaveBeenCalledWith(
        {
          environmentId: 1,
          containerId: 'test-container-id',
          pullImage: true,
          nodeName: 'node1',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  it('should detect cannotPullImage when image starts with sha256', async () => {
    const user = userEvent.setup();
    mockConfirmContainerRecreation.mockResolvedValue({ pullLatest: false });

    renderComponent({
      containerImage: 'sha256:1234567890abcdef',
    });

    const recreateButton = await screen.findByTestId(
      'recreate-container-button'
    );
    await user.click(recreateButton);

    await waitFor(() => {
      expect(mockConfirmContainerRecreation).toHaveBeenCalledWith(true);
    });
  });

  it('should not call recreate mutation when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirmContainerRecreation.mockResolvedValue(undefined);

    renderComponent();

    const recreateButton = await screen.findByTestId(
      'recreate-container-button'
    );
    await user.click(recreateButton);

    await waitFor(() => {
      expect(mockConfirmContainerRecreation).toHaveBeenCalled();
    });

    expect(mockRecreateMutate).not.toHaveBeenCalled();
  });
});

function renderComponent(
  props: Partial<React.ComponentProps<typeof SecondaryActions>> = {}
) {
  const defaultProps: React.ComponentProps<typeof SecondaryActions> = {
    environmentId: 1,
    containerId: 'test-container-id',
    nodeName: 'node1',
    containerImage: 'nginx:latest',
    containerAutoRemove: false,
    isPortainer: false,
    partOfSwarmService: false,
    ...props,
  };

  const mockUser = {
    EndpointAuthorizations: {
      1: { DockerContainerCreate: true },
    },
    PortainerAuthorizations: {},
    Id: 1,
    Role: 1,
    Username: 'mock',
    UseCache: false,
    ThemeSettings: {
      color: 'auto' as const,
      subtleUpgradeButton: false,
    },
  };

  const Wrapper = withTestQueryProvider(
    withUserProvider(withTestRouter(SecondaryActions), mockUser)
  );

  return render(<Wrapper {...defaultProps} />);
}
