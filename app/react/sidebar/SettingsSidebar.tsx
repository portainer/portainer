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
import { SidebarParent } from './SidebarItem/SidebarParent';

interface Props {
  isPureAdmin: boolean;
  isAdmin: boolean;
  isTeamLeader?: boolean;
}

export function SettingsSidebar({ isPureAdmin, isAdmin, isTeamLeader }: Props) {
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  const isPureAdminOrTeamLeader =
    isPureAdmin || (isTeamLeader && !teamSyncQuery.data && !isAdmin);
  const showUsersSection = !window.ddExtension && isPureAdminOrTeamLeader;

  return (
    <SidebarSection title="Administration">
      {showUsersSection && (
        <SidebarParent
          label="User-related"
          icon={Users}
          to="portainer.users"
          pathOptions={{ includePaths: ['portainer.teams', 'portainer.roles'] }}
          data-cy="portainerSidebar-userRelated"
          listId="portainerSidebar-userRelated"
        >
          <SidebarItem
            to="portainer.users"
            label="Users"
            isSubMenu
            data-cy="portainerSidebar-users"
          />
          <SidebarItem
            to="portainer.teams"
            label="Teams"
            isSubMenu
            data-cy="portainerSidebar-teams"
          />

          {isPureAdmin && (
            <SidebarItem
              to="portainer.roles"
              label="Roles"
              isSubMenu
              data-cy="portainerSidebar-roles"
            />
          )}
        </SidebarParent>
      )}
      {isPureAdmin && (
        <>
          <SidebarParent
            label="Environment-related"
            icon={HardDrive}
            to="portainer.endpoints"
            pathOptions={{
              includePaths: [
                'portainer.wizard.endpoints',
                'portainer.groups',
                'portainer.tags',
              ],
            }}
            data-cy="portainerSidebar-environments-area"
            listId="portainer-environments"
          >
            <SidebarItem
              label="Environments"
              to="portainer.endpoints"
              ignorePaths={['portainer.endpoints.updateSchedules']}
              includePaths={['portainer.wizard.endpoints']}
              isSubMenu
              data-cy="portainerSidebar-environments"
            />
            <SidebarItem
              to="portainer.groups"
              label="Groups"
              isSubMenu
              data-cy="portainerSidebar-environmentGroups"
            />
            <SidebarItem
              to="portainer.tags"
              label="Tags"
              isSubMenu
              data-cy="portainerSidebar-environmentTags"
            />
            <EdgeUpdatesSidebarItem />
          </SidebarParent>

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

          <SidebarParent
            label="Logs"
            to="portainer.authLogs"
            icon={FileText}
            pathOptions={{
              includePaths: ['portainer.activityLogs'],
            }}
            data-cy="k8sSidebar-logs"
            listId="k8sSidebar-logs"
          >
            <SidebarItem
              label="Authentication"
              to="portainer.authLogs"
              isSubMenu
              data-cy="portainerSidebar-authLogs"
            />
            <SidebarItem
              to="portainer.activityLogs"
              label="Activity"
              isSubMenu
              data-cy="portainerSidebar-activityLogs"
            />
          </SidebarParent>
        </>
      )}
      {isBE && !isPureAdmin && isAdmin && (
        <SidebarParent
          label="Environment-related"
          icon={HardDrive}
          to="portainer.endpoints.updateSchedules"
          data-cy="portainerSidebar-environments-area"
          listId="portainer-environments-area"
        >
          <EdgeUpdatesSidebarItem />
        </SidebarParent>
      )}

      <SidebarItem
        to="portainer.notifications"
        icon={Bell}
        label="Notifications"
        data-cy="portainerSidebar-notifications"
      />
      {isPureAdmin && (
        <SidebarParent
          to="portainer.settings"
          label="Settings"
          icon={Settings}
          data-cy="portainerSidebar-settings"
          listId="portainer-settings"
        >
          <SidebarItem
            to="portainer.settings"
            label="General"
            isSubMenu
            ignorePaths={[
              'portainer.settings.authentication',
              'portainer.settings.sharedcredentials',
              'portainer.settings.edgeCompute',
            ]}
            data-cy="portainerSidebar-generalSettings"
          />
          {!window.ddExtension && (
            <SidebarItem
              to="portainer.settings.authentication"
              label="Authentication"
              isSubMenu
              data-cy="portainerSidebar-authentication"
            />
          )}
          {isBE && (
            <SidebarItem
              to="portainer.settings.sharedcredentials"
              label="Shared Credentials"
              isSubMenu
              data-cy="portainerSidebar-cloud"
            />
          )}

          <SidebarItem
            to="portainer.settings.edgeCompute"
            label="Edge Compute"
            isSubMenu
            data-cy="portainerSidebar-edgeCompute"
          />

          <SidebarItem.Wrapper label="Get Help">
            <a
              href={
                process.env.PORTAINER_EDITION === 'CE'
                  ? 'https://www.portainer.io/community_help'
                  : 'https://documentation.portainer.io/r/business-support'
              }
              target="_blank"
              rel="noreferrer"
              className="hover:!underline focus:no-underline text-sm flex h-8 w-full items-center rounded px-3 transition-colors duration-200 hover:bg-blue-5/20 be:hover:bg-gray-5/20 th-dark:hover:bg-gray-true-5/20"
            >
              Get Help
            </a>
          </SidebarItem.Wrapper>
        </SidebarParent>
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
      isSubMenu
      data-cy="portainerSidebar-updateSchedules"
    />
  );
}
