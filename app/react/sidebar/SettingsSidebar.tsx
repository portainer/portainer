import {
  Users,
  Award,
  Settings,
  HardDrive,
  Radio,
  FileText,
  Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

export function SettingsSidebar({
  isPureAdmin,
  isAdmin,
  isTeamLeader = false,
}: Props) {
  const { t } = useTranslation();
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  const isPureAdminOrTeamLeader =
    isPureAdmin || (isTeamLeader && !teamSyncQuery.data && !isAdmin);
  const showUsersSection = !window.ddExtension && isPureAdminOrTeamLeader;

  return (
    <SidebarSection title={t('sidebar.administration')}>
      {showUsersSection && (
        <SidebarParent
          label={t('sidebar.user_related')}
          icon={Users}
          to="portainer.users"
          pathOptions={{ includePaths: ['portainer.teams', 'portainer.roles'] }}
          data-cy="portainerSidebar-userRelated"
          listId="portainerSidebar-userRelated"
        >
          <SidebarItem
            to="portainer.users"
            label={t('sidebar.users')}
            isSubMenu
            data-cy="portainerSidebar-users"
          />
          <SidebarItem
            to="portainer.teams"
            label={t('sidebar.teams')}
            isSubMenu
            data-cy="portainerSidebar-teams"
          />

          {isPureAdmin && (
            <SidebarItem
              to="portainer.roles"
              label={t('sidebar.roles')}
              isSubMenu
              data-cy="portainerSidebar-roles"
            />
          )}
        </SidebarParent>
      )}
      {isPureAdmin && (
        <>
          <SidebarParent
            label={t('sidebar.environment_related')}
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
              label={t('sidebar.environments')}
              to="portainer.endpoints"
              ignorePaths={['portainer.endpoints.updateSchedules']}
              includePaths={['portainer.wizard.endpoints']}
              isSubMenu
              data-cy="portainerSidebar-environments"
            />
            <SidebarItem
              to="portainer.groups"
              label={t('sidebar.groups')}
              isSubMenu
              data-cy="portainerSidebar-environmentGroups"
            />
            <SidebarItem
              to="portainer.tags"
              label={t('sidebar.tags')}
              isSubMenu
              data-cy="portainerSidebar-environmentTags"
            />
            <EdgeUpdatesSidebarItem />
          </SidebarParent>

          <SidebarItem
            label={t('sidebar.registries')}
            to="portainer.registries"
            icon={Radio}
            data-cy="portainerSidebar-registries"
          />

          {isBE && (
            <SidebarItem
              to="portainer.licenses"
              label={t('sidebar.licenses')}
              icon={Award}
              data-cy="portainerSidebar-licenses"
            />
          )}

          <SidebarParent
            label={t('sidebar.logs')}
            to="portainer.authLogs"
            icon={FileText}
            pathOptions={{
              includePaths: ['portainer.activityLogs'],
            }}
            data-cy="k8sSidebar-logs"
            listId="k8sSidebar-logs"
          >
            <SidebarItem
              label={t('sidebar.authentication_logs')}
              to="portainer.authLogs"
              isSubMenu
              data-cy="portainerSidebar-authLogs"
            />
            <SidebarItem
              to="portainer.activityLogs"
              label={t('sidebar.activity_logs')}
              isSubMenu
              data-cy="portainerSidebar-activityLogs"
            />
          </SidebarParent>
        </>
      )}
      {isBE && !isPureAdmin && isAdmin && (
        <SidebarParent
          label={t('sidebar.environment_related')}
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
        label={t('sidebar.notifications')}
        data-cy="portainerSidebar-notifications"
      />
      {isPureAdmin && (
        <SidebarParent
          to="portainer.settings"
          label={t('sidebar.settings')}
          icon={Settings}
          data-cy="portainerSidebar-settings"
          listId="portainer-settings"
        >
          <SidebarItem
            to="portainer.settings"
            label={t('sidebar.general')}
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
              label={t('sidebar.authentication_settings')}
              isSubMenu
              data-cy="portainerSidebar-authentication"
            />
          )}
          {isBE && (
            <SidebarItem
              to="portainer.settings.sharedcredentials"
              label={t('sidebar.shared_credentials')}
              isSubMenu
              data-cy="portainerSidebar-cloud"
            />
          )}

          <SidebarItem
            to="portainer.settings.edgeCompute"
            label={t('sidebar.edge_compute')}
            isSubMenu
            data-cy="portainerSidebar-edgeCompute"
          />

          <SidebarItem.Wrapper label={t('sidebar.get_help')}>
            <a
              href={
                isBE
                  ? 'https://documentation.portainer.io/r/business-support'
                  : 'https://www.portainer.io/community_help'
              }
              target="_blank"
              rel="noreferrer"
              className="!text-inherit hover:!underline focus:no-underline text-sm flex h-8 w-full items-center rounded px-3 transition-colors duration-200 hover:bg-blue-5/20 be:hover:bg-gray-5/20 th-dark:hover:bg-gray-true-5/20"
            >
              {t('sidebar.get_help')}
            </a>
          </SidebarItem.Wrapper>
        </SidebarParent>
      )}
    </SidebarSection>
  );
}

function EdgeUpdatesSidebarItem() {
  const { t } = useTranslation();
  const settingsQuery = usePublicSettings();

  if (!isBE || !settingsQuery.data?.EnableEdgeComputeFeatures) {
    return null;
  }

  return (
    <SidebarItem
      to="portainer.endpoints.updateSchedules"
      label={t('sidebar.update_rollback')}
      isSubMenu
      data-cy="portainerSidebar-updateSchedules"
    />
  );
}
