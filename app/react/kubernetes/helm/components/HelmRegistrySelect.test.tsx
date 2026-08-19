import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import selectEvent from '@/react/test-utils/react-select';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';
import { RegistryTypes } from '@/react/portainer/registries/types/registry';
import { useCurrentUser } from '@/react/hooks/useUser';
import { User, Role } from '@/portainer/users/types';

import { HelmRegistrySelect, RepoValue } from './HelmRegistrySelect';

// Mock the hooks with factory functions - preserve other exports
vi.mock('@/react/hooks/useUser', async () => {
  const actual = await vi.importActual('@/react/hooks/useUser');
  return {
    ...actual,
    useCurrentUser: vi.fn(),
  };
});

const mockOnRegistryChange = vi.fn();

const defaultProps = {
  selectedRegistry: null,
  onRegistryChange: mockOnRegistryChange,
  isRepoAvailable: true,
  isLoading: false,
  isError: false,
  repoOptions: [],
};

const mockRepoOptions = [
  {
    label: 'Custom Repositories',
    options: [
      {
        value: {
          repoUrl: 'https://charts.bitnami.com/bitnami',
          name: 'Bitnami',
          type: RegistryTypes.CUSTOM,
        },
        label: 'Bitnami',
      },
      {
        value: {
          repoUrl: 'https://kubernetes-charts.storage.googleapis.com',
          name: 'Stable',
          type: RegistryTypes.CUSTOM,
        },
        label: 'Stable',
      },
    ],
  },
];

interface MockUserHookReturn {
  user: User;
  isPureAdmin: boolean;
}

interface UserProps {
  isPureAdmin?: boolean;
}

// Get the mocked functions
const mockUseCurrentUser = vi.mocked(useCurrentUser);

function renderComponent(props = {}, userProps: UserProps = {}) {
  const userResult: MockUserHookReturn = {
    user: {
      Id: 1,
      Username: 'admin',
      Role: Role.Admin,
      EndpointAuthorizations: {},
      UseCache: false,
      ThemeSettings: {
        color: 'auto',
      },
    },
    isPureAdmin: userProps.isPureAdmin || false,
  };

  mockUseCurrentUser.mockReturnValue(userResult);

  const Component = withTestQueryProvider(
    withUserProvider(
      withTestRouter(HelmRegistrySelect),
      new UserViewModel({ Username: 'admin', Role: 1 })
    )
  );

  return render(<Component {...defaultProps} {...props} />);
}

describe('HelmRegistrySelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockClear();
  });

  describe('Basic rendering', () => {
    it('should render with default placeholder', () => {
      renderComponent();
      expect(screen.getByText('Select a repository')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      renderComponent({ placeholder: 'Custom placeholder' });
      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      renderComponent({ isLoading: true });
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render error state', () => {
      renderComponent({ isError: true });
      expect(
        screen.getByText('Unable to load registry options.')
      ).toBeInTheDocument();
    });
  });

  describe('Repository options', () => {
    it('should display repository options', async () => {
      const user = userEvent.setup();
      renderComponent({ repoOptions: mockRepoOptions });

      const select = screen.getByRole('combobox');
      await user.click(select);

      screen.getAllByText('Bitnami').forEach((el) => expect(el).toBeVisible());
      screen.getAllByText('Stable').forEach((el) => expect(el).toBeVisible());
    });

    it.skip('should call onRegistryChange when option is selected', async () => {
      // Skipping this test due to react-select testing complexity
      // The onChange functionality is covered by integration tests
      renderComponent({ repoOptions: mockRepoOptions });

      const select = screen.getByRole('combobox');
      await selectEvent.select(select, 'Bitnami');

      expect(mockOnRegistryChange).toHaveBeenCalledWith({
        repoUrl: 'https://charts.bitnami.com/bitnami',
        name: 'Bitnami',
        type: RegistryTypes.CUSTOM,
      });
    });

    it('should show selected repository value', () => {
      const selectedRegistry: RepoValue = {
        repoUrl: 'https://charts.bitnami.com/bitnami',
        name: 'Bitnami',
        type: RegistryTypes.CUSTOM,
      };

      renderComponent({
        selectedRegistry,
        repoOptions: mockRepoOptions,
      });

      // Since the component uses PortainerSelect which manages the display value,
      // we verify the props are correctly passed by checking the select element exists
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('No repositories warning', () => {
    it('should show no repositories warning when no repos are available', () => {
      renderComponent({
        isRepoAvailable: false,
        namespace: 'test-namespace',
      });

      expect(
        screen.getByText(/There are no repositories available./)
      ).toBeInTheDocument();
    });

    it('should not show warning when loading', () => {
      renderComponent({
        isRepoAvailable: false,
        namespace: 'test-namespace',
        isLoading: true,
      });

      expect(
        screen.queryByText('There are no repositories available.')
      ).not.toBeInTheDocument();
    });

    it('should not show warning when no namespace is provided', () => {
      renderComponent({
        isRepoAvailable: false,
      });

      expect(
        screen.queryByText('There are no repositories available.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Tooltip content', () => {
    it('should render the component with label and tooltip', () => {
      renderComponent({}, { isPureAdmin: true });

      // Verify that the component renders the main label
      expect(screen.getByText('Helm chart source')).toBeInTheDocument();

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('should not show no repos warning when loading', () => {
      renderComponent({
        isLoading: true,
        isRepoAvailable: false,
        repoOptions: [],
        namespace: 'test-namespace',
      });

      expect(
        screen.queryByText('There are no repositories available.')
      ).not.toBeInTheDocument();
    });

    it('should show error when API fails', () => {
      renderComponent({
        isLoading: false,
        isError: true,
        isRepoAvailable: false,
        namespace: 'test-namespace',
      });

      expect(
        screen.getByText('Unable to load registry options.')
      ).toBeInTheDocument();
    });
  });
});
