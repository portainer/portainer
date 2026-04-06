import { Box, Clock, LayoutGrid, Layers, Puzzle, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isBE } from '../portainer/feature-flags/feature-flags.service';
import { useSettings } from '../portainer/settings/queries';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { SidebarParent } from './SidebarItem/SidebarParent';

export function EdgeComputeSidebar() {
  const { t } = useTranslation();
  const settingsQuery = useSettings();

  if (!settingsQuery.data || !settingsQuery.data.EnableEdgeComputeFeatures) {
    return null;
  }

  const settings = settingsQuery.data;

  return (
    <SidebarSection title={t('edge.compute')}>
      <SidebarItem
        to="edge.groups"
        label={t('edge.groups.label')}
        icon={LayoutGrid}
        data-cy="portainerSidebar-edgeGroups"
      />
      <SidebarItem
        to="edge.stacks"
        label={t('edge.stacks.label')}
        icon={Layers}
        data-cy="portainerSidebar-edgeStacks"
      />
      <SidebarItem
        to="edge.jobs"
        label={t('edge.jobs.label')}
        icon={Clock}
        data-cy="portainerSidebar-edgeJobs"
      />
      {isBE && (
        <SidebarItem
          to="edge.configurations"
          label={t('edge.configurations')}
          icon={Puzzle}
          data-cy="portainerSidebar-edgeConfigurations"
        />
      )}
      {isBE && !settings.TrustOnFirstConnect && (
        <SidebarItem
          to="edge.devices.waiting-room"
          label={t('edge.waiting_room')}
          icon={Box}
          data-cy="portainerSidebar-edgeDevicesWaitingRoom"
        />
      )}
      <SidebarParent
        icon={Edit}
        label={t('edge.templates')}
        to="edge.templates"
        data-cy="edgeSidebar-templates"
        listId="edgeSidebar-templates"
      >
        <SidebarItem
          label={t('edge.app_templates')}
          to="edge.templates"
          ignorePaths={['edge.templates.custom']}
          isSubMenu
          data-cy="edgeSidebar-appTemplates"
        />
        <SidebarItem
          label={t('edge.custom_templates')}
          to="edge.templates.custom"
          isSubMenu
          data-cy="edgeSidebar-customTemplates"
        />
      </SidebarParent>
    </SidebarSection>
  );
}
