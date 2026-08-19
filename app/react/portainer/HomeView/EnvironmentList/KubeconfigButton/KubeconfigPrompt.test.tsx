import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import * as notifications from '@/portainer/services/notifications';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { usePaginationLimitState } from '@/react/hooks/usePaginationLimitState';
import { useListSelection } from '@/react/hooks/useListSelection';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { downloadKubeconfigFile } from '@/react/portainer/HomeView/EnvironmentList/KubeconfigButton/kubeconfig.service';

import { KubeconfigPrompt, KubeconfigPromptProps } from './KubeconfigPrompt';

vi.mock('@/react/portainer/settings/queries', () => ({
  usePublicSettings: vi.fn(),
}));

vi.mock('@/react/portainer/environments/queries/useEnvironmentList', () => ({
  useEnvironmentList: vi.fn(),
}));

vi.mock('@/react/hooks/usePaginationLimitState', () => ({
  usePaginationLimitState: vi.fn(),
}));

vi.mock('@/react/hooks/useListSelection', () => ({
  useListSelection: vi.fn(),
}));

vi.mock(
  '@/react/portainer/HomeView/EnvironmentList/KubeconfigButton/kubeconfig.service',
  () => ({
    downloadKubeconfigFile: vi.fn(),
  })
);

vi.mock('@/portainer/services/notifications', () => ({
  warning: vi.fn(),
  error: vi.fn(),
}));

function createMockEnvironment(
  id: number,
  name: string,
  status = 1
): Environment {
  return {
    Id: id,
    Name: name,
    Type: EnvironmentType.AgentOnKubernetes,
    URL: `https://k8s-${name}.example.com`,
    Status: status,
    GroupId: 1,
    PublicURL: '',
    EdgeID: '',
    EdgeKey: '',
    EdgeCheckinInterval: 0,
    QueryDate: 0,
    LastCheckInDate: 0,
    Snapshots: [],
    Kubernetes: {
      Snapshots: [],
      Configuration: {
        IngressClasses: [],
      },
    },
    Agent: {
      Version: '2.0.0',
    },
    TagIds: [],
    UserAccessPolicies: {},
    TeamAccessPolicies: {},
  } as unknown as Environment;
}

const defaultProps: KubeconfigPromptProps = {
  envQueryParams: {},
  onClose: vi.fn(),
  selectedItems: [],
};

describe('KubeconfigPrompt', () => {
  let mockToggleSelection: ReturnType<typeof vi.fn>;
  let mockSetPageLimit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockToggleSelection = vi.fn();
    mockSetPageLimit = vi.fn();

    vi.mocked(usePublicSettings).mockReturnValue({
      data: 'The kubeconfig file will expire in 7 days.',
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePublicSettings>);

    vi.mocked(usePaginationLimitState).mockReturnValue([
      10,
      mockSetPageLimit,
    ] as ReturnType<typeof usePaginationLimitState>);

    vi.mocked(useListSelection).mockReturnValue([
      [],
      mockToggleSelection,
    ] as ReturnType<typeof useListSelection>);

    vi.mocked(useEnvironmentList).mockReturnValue({
      environments: [
        createMockEnvironment(1, 'k8s-dev'),
        createMockEnvironment(2, 'k8s-prod'),
        createMockEnvironment(3, 'k8s-staging'),
      ],
      totalCount: 3,
      isLoading: false,
    } as ReturnType<typeof useEnvironmentList>);

    vi.mocked(downloadKubeconfigFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render environment list with checkboxes', () => {
      renderComponent();

      expect(
        screen.getByTestId('select-environment-checkbox-k8s-dev')
      ).toBeVisible();
      expect(
        screen.getByTestId('select-environment-checkbox-k8s-prod')
      ).toBeVisible();
      expect(
        screen.getByTestId('select-environment-checkbox-k8s-staging')
      ).toBeVisible();
    });

    it('should render environment names with URLs', () => {
      renderComponent();

      expect(
        screen.getByText('k8s-dev (https://k8s-k8s-dev.example.com)')
      ).toBeVisible();
      expect(
        screen.getByText('k8s-prod (https://k8s-k8s-prod.example.com)')
      ).toBeVisible();
    });
  });

  describe('Selection', () => {
    it('should initialize with selectedItems from props', () => {
      renderComponent({ selectedItems: [1, 2] });

      expect(useListSelection).toHaveBeenCalledWith([1, 2]);
    });

    it('should call toggleSelection when individual checkbox is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const checkbox = screen.getByTestId(
        'select-environment-checkbox-k8s-dev'
      );
      await user.click(checkbox);

      expect(mockToggleSelection).toHaveBeenCalledWith(1, true);
    });

    it('should show select all checkbox unchecked when no items selected', () => {
      vi.mocked(useListSelection).mockReturnValue([
        [],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      expect(selectAllCheckbox).not.toBeChecked();
    });

    it('should show select all checkbox checked when all items on page are selected', () => {
      vi.mocked(useListSelection).mockReturnValue([
        [1, 2, 3],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should call toggleSelection for all environments when select all is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useListSelection).mockReturnValue([
        [],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);

      expect(mockToggleSelection).toHaveBeenCalledTimes(3);
      expect(mockToggleSelection).toHaveBeenCalledWith(1, true);
      expect(mockToggleSelection).toHaveBeenCalledWith(2, true);
      expect(mockToggleSelection).toHaveBeenCalledWith(3, true);
    });

    it('should deselect all when select all is clicked and all are selected', async () => {
      const user = userEvent.setup();
      vi.mocked(useListSelection).mockReturnValue([
        [1, 2, 3],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);

      expect(mockToggleSelection).toHaveBeenCalledTimes(3);
      expect(mockToggleSelection).toHaveBeenCalledWith(1, false);
      expect(mockToggleSelection).toHaveBeenCalledWith(2, false);
      expect(mockToggleSelection).toHaveBeenCalledWith(3, false);
    });
  });

  describe('Download Functionality', () => {
    it('should disable download button when no environments selected', () => {
      vi.mocked(useListSelection).mockReturnValue([
        [],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const downloadButton = screen.getByTestId(
        'download-kubeconfig-confirmbutton'
      );
      expect(downloadButton).toBeDisabled();
    });

    it('should enable download button when environments are selected', () => {
      vi.mocked(useListSelection).mockReturnValue([
        [1, 2],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const downloadButton = screen.getByTestId(
        'download-kubeconfig-confirmbutton'
      );
      expect(downloadButton).not.toBeDisabled();
    });

    it('should show error notification when download fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      vi.mocked(downloadKubeconfigFile).mockRejectedValue(error);
      vi.mocked(useListSelection).mockReturnValue([
        [1],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent();

      const downloadButton = screen.getByTestId(
        'download-kubeconfig-confirmbutton'
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(notifications.error).toHaveBeenCalledWith(
          'Failed downloading kubeconfig file',
          error
        );
      });
    });

    it('should not close modal when download fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      vi.mocked(downloadKubeconfigFile).mockRejectedValue(
        new Error('Network error')
      );
      vi.mocked(useListSelection).mockReturnValue([
        [1],
        mockToggleSelection,
      ] as ReturnType<typeof useListSelection>);

      renderComponent({ onClose });

      const downloadButton = screen.getByTestId(
        'download-kubeconfig-confirmbutton'
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(notifications.error).toHaveBeenCalled();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

function renderComponent(
  props: Partial<KubeconfigPromptProps> = {}
): ReturnType<typeof render> {
  const user = new UserViewModel({ Username: 'testuser' });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      () => <KubeconfigPrompt {...defaultProps} {...props} />,
      user
    )
  );

  return render(<Wrapped />);
}
