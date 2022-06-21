import {
  Users,
  Award,
  Settings,
  HardDrive,
  Radio,
  FileText,
} from 'react-feather';

import { usePublicSettings } from '@/portainer/settings/queries';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

interface Props {
  isAdmin: boolean;
}

export function SettingsSidebar({ isAdmin }: Props) {
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  const showUsersSection =
    !window.ddExtension && (isAdmin || teamSyncQuery.data);

  return (
    <SidebarSection title="Settings">
      {showUsersSection && (
        <SidebarItem to="portainer.users" label="Users" icon={Users}>
          <SidebarItem to="portainer.teams" label="Teams" />

          {isAdmin && <SidebarItem to="portainer.roles" label="Roles" />}
        </SidebarItem>
      )}
      {isAdmin && (
        <>
          <SidebarItem
            label="Environments"
            to="portainer.endpoints"
            icon={HardDrive}
            openOnPaths={['portainer.wizard.endpoints']}
          >
            <SidebarItem to="portainer.groups" label="Groups" />
            <SidebarItem to="portainer.tags" label="Tags" />
          </SidebarItem>

          <SidebarItem
            label="Registries"
            to="portainer.registries"
            icon={Radio}
          />

          {process.env.PORTAINER_EDITION !== 'CE' && (
            <SidebarItem
              to="portainer.licenses"
              label="Licenses"
              icon={Award}
            />
          )}

          <SidebarItem
            label="Authentication logs"
            to="portainer.authLogs"
            icon={FileText}
          >
            <SidebarItem to="portainer.activityLogs" label="Activity Logs" />
          </SidebarItem>

          <SidebarItem to="portainer.settings" label="Settings" icon={Settings}>
            {!window.ddExtension && (
              <SidebarItem
                to="portainer.settings.authentication"
                label="Authentication"
              />
            )}
            <SidebarItem to="portainer.settings.cloud" label="Cloud" />

            <SidebarItem
              to="portainer.settings.edgeCompute"
              label="Edge Compute"
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
                className="px-3 rounded flex h-full items-center"
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
