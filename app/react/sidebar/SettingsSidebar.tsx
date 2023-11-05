import {
  Users,
  Award,
  Settings,
  HardDrive,
  Radio,
  FileText,
  Bell,
} from 'lucide-react';

import { usePublicSettings } from '@/react/portainer/settings/queries';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

interface Props {
  isAdmin: boolean;
  isTeamLeader?: boolean;
}

export function SettingsSidebar({ isAdmin, isTeamLeader }: Props) {
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  const showUsersSection =
    !window.ddExtension && (isAdmin || (isTeamLeader && !teamSyncQuery.data));

  return (
    <SidebarSection title="Settings">
      {showUsersSection && (
        <SidebarItem
          to="portainer.users"
          label="Users"
          icon={Users}
          data-cy="portainerSidebar-users"
        >
          <SidebarItem
            to="portainer.teams"
            label="Teams"
            data-cy="portainerSidebar-teams"
          />

          {isAdmin && (
            <SidebarItem
              to="portainer.roles"
              label="Roles"
              data-cy="portainerSidebar-roles"
            />
          )}
        </SidebarItem>
      )}
      {isAdmin && (
        <>
          <SidebarItem
            label="Environments"
            to="portainer.endpoints"
            icon={HardDrive}
            openOnPaths={['portainer.wizard.endpoints']}
            data-cy="portainerSidebar-environments"
          >
            <SidebarItem
              to="portainer.groups"
              label="Groups"
              data-cy="portainerSidebar-environmentGroups"
            />
            <SidebarItem
              to="portainer.tags"
              label="Tags"
              data-cy="portainerSidebar-environmentTags"
            />
            <EdgeUpdatesSidebarItem />
          </SidebarItem>

          <SidebarItem
            label="Registries"
            to="portainer.registries"
            icon={Radio}
            data-cy="portainerSidebar-registries"
          />

          {isBE && (
            <SidebarItem
              to="portainer.licenses"
              label="Licenses"
              icon={Award}
              data-cy="portainerSidebar-licenses"
            />
          )}

          <SidebarItem
            label="Authentication logs"
            to="portainer.authLogs"
            icon={FileText}
            data-cy="portainerSidebar-authLogs"
          >
            <SidebarItem
              to="portainer.activityLogs"
              label="Activity Logs"
              data-cy="portainerSidebar-activityLogs"
            />
          </SidebarItem>
        </>
      )}
      <SidebarItem
        to="portainer.notifications"
        icon={Bell}
        label="Notifications"
        data-cy="portainerSidebar-notifications"
      />
      {isAdmin && (
        <SidebarItem
          to="portainer.settings"
          label="Settings"
          icon={Settings}
          data-cy="portainerSidebar-settings"
        >
          {!window.ddExtension && (
            <SidebarItem
              to="portainer.settings.authentication"
              label="Authentication"
              data-cy="portainerSidebar-authentication"
            />
          )}
          {isBE && (
            <SidebarItem
              to="portainer.settings.cloud"
              label="Cloud"
              data-cy="portainerSidebar-cloud"
            />
          )}
          <SidebarItem
            to="portainer.settings.edgeCompute"
            label="Edge Compute"
            data-cy="portainerSidebar-edgeCompute"
          />

          <SidebarItem.Wrapper label="Help / About">
            <a
              href={
                process.env.PORTAINER_EDITION === 'CE'
                  ? 'https://www.portainer.io/community_help'
                  : 'https://documentation.portainer.io/r/business-support'
              }
              target="_blank"
              rel="noreferrer"
              className="flex h-8 items-center rounded px-3"
            >
              Help / About
            </a>
          </SidebarItem.Wrapper>
        </SidebarItem>
      )}
    </SidebarSection>
  );
}

function EdgeUpdatesSidebarItem() {
  const settingsQuery = usePublicSettings();

  if (!isBE || !settingsQuery.data?.EnableEdgeComputeFeatures) {
    return null;
  }

  return (
    <SidebarItem
      to="portainer.endpoints.updateSchedules"
      label="Update & Rollback"
      data-cy="portainerSidebar-updateSchedules"
    />
  );
}
