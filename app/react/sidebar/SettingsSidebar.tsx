import {
  Users,
  Award,
  Settings,
  HardDrive,
  Radio,
  FileText,
} from 'react-feather';

import { usePublicSettings } from '@/react/portainer/settings/queries';
import {
  FeatureFlag,
  useFeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';

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

  const isEdgeRemoteUpgradeEnabledQuery = useFeatureFlag(
    FeatureFlag.EdgeRemoteUpdate
  );

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
            {isEdgeRemoteUpgradeEnabledQuery.data && (
              <SidebarItem
                to="portainer.endpoints.updateSchedules"
                label="Update & Rollback"
                data-cy="portainerSidebar-updateSchedules"
              />
            )}
          </SidebarItem>

          <SidebarItem
            label="Registries"
            to="portainer.registries"
            icon={Radio}
            data-cy="portainerSidebar-registries"
          />

          {process.env.PORTAINER_EDITION !== 'CE' && (
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
            {process.env.PORTAINER_EDITION !== 'CE' && (
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
                className="px-3 rounded flex h-8 items-center"
              >
                Help / About
              </a>
            </SidebarItem.Wrapper>
          </SidebarItem>
        </>
      )}
    </SidebarSection>
  );
}
