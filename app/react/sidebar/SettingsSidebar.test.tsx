import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import * as featureFlags from '@/react/portainer/feature-flags/feature-flags.service';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { PublicSettingsResponse } from '@/react/portainer/settings/types';

import { TestSidebarProvider } from './useSidebarState';
import { SettingsSidebar } from './SettingsSidebar';

vi.mock('@/react/portainer/settings/queries', () => ({
  usePublicSettings: vi.fn(),
}));

describe('SettingsSidebar', () => {
  beforeEach(() => {
    vi.spyOn(featureFlags, 'isBE', 'get').mockReturnValue(false);
    // Default mock for usePublicSettings - returns data based on selector
    vi.mocked(usePublicSettings).mockImplementation(((options?: {
      select?: (settings: PublicSettingsResponse) => PublicSettingsResponse;
    }) => {
      const settings: PublicSettingsResponse = {
        TeamSync: false,
        EnableEdgeComputeFeatures: false,
      } as unknown as PublicSettingsResponse;
      return {
        data: options?.select ? options.select(settings) : settings,
        isLoading: false,
        isError: false,
      };
    }) as typeof usePublicSettings);
    window.ddExtension = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pure Admin User', () => {
    it('should render all admin sections for pure admin', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-userRelated')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-environments-area')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-registries')
      ).toBeInTheDocument();
      expect(screen.getByTestId('k8sSidebar-logs')).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-notifications')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-settings')
      ).toBeInTheDocument();
    });

    it('should render user-related submenu items', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(screen.getByTestId('portainerSidebar-users')).toBeInTheDocument();
      expect(screen.getByTestId('portainerSidebar-teams')).toBeInTheDocument();
      expect(screen.getByTestId('portainerSidebar-roles')).toBeInTheDocument();
    });

    it('should render environment-related submenu items', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.getByTestId('portainerSidebar-environments')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-environmentGroups')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-environmentTags')
      ).toBeInTheDocument();
    });

    it('should render logs submenu items', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.getByTestId('portainerSidebar-authLogs')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-activityLogs')
      ).toBeInTheDocument();
    });

    it('should render settings submenu items', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.getByTestId('portainerSidebar-generalSettings')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-authentication')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-edgeCompute')
      ).toBeInTheDocument();
    });

    it('should render Get Help link with correct CE URL', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      const helpLink = screen.getByRole('link', { name: /Get Help/i });
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute(
        'href',
        'https://www.portainer.io/community_help'
      );
      expect(helpLink).toHaveAttribute('target', '_blank');
      expect(helpLink).toHaveAttribute('rel', 'noreferrer');
    });

    it('should not render Licenses sidebar item in CE', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-licenses')
      ).not.toBeInTheDocument();
    });

    it('should not render Shared Credentials in CE', () => {
      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-cloud')
      ).not.toBeInTheDocument();
    });
  });

  describe('Team Leader User', () => {
    it('should render user-related section for team leader when TeamSync is disabled', () => {
      vi.mocked(usePublicSettings).mockReturnValue({
        data: false,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePublicSettings>);

      renderComponent({
        isPureAdmin: false,
        isAdmin: false,
        isTeamLeader: true,
      });

      expect(
        screen.getByTestId('portainerSidebar-userRelated')
      ).toBeInTheDocument();
      expect(screen.getByTestId('portainerSidebar-users')).toBeInTheDocument();
      expect(screen.getByTestId('portainerSidebar-teams')).toBeInTheDocument();
    });

    it('should not render Roles for team leader', () => {
      vi.mocked(usePublicSettings).mockReturnValue({
        data: false,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePublicSettings>);

      renderComponent({
        isPureAdmin: false,
        isAdmin: false,
        isTeamLeader: true,
      });

      expect(
        screen.queryByTestId('portainerSidebar-roles')
      ).not.toBeInTheDocument();
    });

    it('should not render user-related section when TeamSync is enabled', () => {
      vi.mocked(usePublicSettings).mockReturnValue({
        data: true,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePublicSettings>);

      renderComponent({
        isPureAdmin: false,
        isAdmin: false,
        isTeamLeader: true,
      });

      expect(
        screen.queryByTestId('portainerSidebar-userRelated')
      ).not.toBeInTheDocument();
    });

    it('should not render admin-only sections for team leader', () => {
      renderComponent({
        isPureAdmin: false,
        isAdmin: false,
        isTeamLeader: true,
      });

      expect(
        screen.queryByTestId('portainerSidebar-environments-area')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('portainerSidebar-registries')
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('k8sSidebar-logs')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('portainerSidebar-settings')
      ).not.toBeInTheDocument();
    });

    it('should render notifications for team leader', () => {
      renderComponent({
        isPureAdmin: false,
        isAdmin: false,
        isTeamLeader: true,
      });

      expect(
        screen.getByTestId('portainerSidebar-notifications')
      ).toBeInTheDocument();
    });
  });

  describe('Regular Admin User (not Pure Admin)', () => {
    it('should not render admin-only sections', () => {
      renderComponent({ isPureAdmin: false, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-userRelated')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('portainerSidebar-environments-area')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('portainerSidebar-registries')
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('k8sSidebar-logs')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('portainerSidebar-settings')
      ).not.toBeInTheDocument();
    });

    it('should render notifications for regular admin', () => {
      renderComponent({ isPureAdmin: false, isAdmin: true });

      expect(
        screen.getByTestId('portainerSidebar-notifications')
      ).toBeInTheDocument();
    });
  });

  describe('DD Extension Environment', () => {
    it('should not render user-related section when ddExtension is enabled', () => {
      window.ddExtension = true;

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-userRelated')
      ).not.toBeInTheDocument();
    });

    it('should not render authentication settings when ddExtension is enabled', () => {
      window.ddExtension = true;

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-authentication')
      ).not.toBeInTheDocument();
    });

    it('should still render other admin sections when ddExtension is enabled', () => {
      window.ddExtension = true;

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.getByTestId('portainerSidebar-environments-area')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-registries')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('portainerSidebar-settings')
      ).toBeInTheDocument();
    });
  });

  describe('Edge Compute Features', () => {
    it('should not render Update & Rollback when edge compute is disabled in CE', () => {
      vi.mocked(usePublicSettings).mockImplementation(((options?: {
        select?: (settings: PublicSettingsResponse) => PublicSettingsResponse;
      }) => {
        const settings: PublicSettingsResponse = {
          TeamSync: false,
          EnableEdgeComputeFeatures: false,
        } as unknown as PublicSettingsResponse;
        return {
          data: options?.select ? options.select(settings) : settings,
          isLoading: false,
          isError: false,
        };
      }) as typeof usePublicSettings);

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-updateSchedules')
      ).not.toBeInTheDocument();
    });

    it('should not render Update & Rollback in CE even when edge compute is enabled', () => {
      vi.mocked(usePublicSettings).mockImplementation(((options?: {
        select?: (settings: PublicSettingsResponse) => PublicSettingsResponse;
      }) => {
        const settings: PublicSettingsResponse = {
          TeamSync: false,
          EnableEdgeComputeFeatures: true,
        } as unknown as PublicSettingsResponse;
        return {
          data: options?.select ? options.select(settings) : settings,
          isLoading: false,
          isError: false,
        };
      }) as typeof usePublicSettings);

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(
        screen.queryByTestId('portainerSidebar-updateSchedules')
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state for public settings', () => {
      vi.mocked(usePublicSettings).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof usePublicSettings>);

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('should handle error state for public settings', () => {
      vi.mocked(usePublicSettings).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof usePublicSettings>);

      renderComponent({ isPureAdmin: true, isAdmin: true });

      expect(screen.getByText('Administration')).toBeInTheDocument();
    });
  });
});

function renderComponent({
  isPureAdmin,
  isAdmin,
  isTeamLeader = false,
}: {
  isPureAdmin: boolean;
  isAdmin: boolean;
  isTeamLeader?: boolean;
}) {
  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withUserProvider(withTestRouter(SettingsSidebar), user);

  return render(
    <TestSidebarProvider>
      <Wrapped
        isPureAdmin={isPureAdmin}
        isAdmin={isAdmin}
        isTeamLeader={isTeamLeader}
      />
    </TestSidebarProvider>
  );
}
