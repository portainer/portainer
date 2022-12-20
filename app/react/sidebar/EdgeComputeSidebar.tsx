import { Box, Clock, LayoutGrid, Layers } from 'lucide-react';

import { isBE } from '../portainer/feature-flags/feature-flags.service';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

export function EdgeComputeSidebar() {
  return (
    <SidebarSection title="Edge compute">
      <SidebarItem
        to="edge.groups"
        label="Edge Groups"
        icon={LayoutGrid}
        data-cy="portainerSidebar-edgeGroups"
      />
      <SidebarItem
        to="edge.stacks"
        label="Edge Stacks"
        icon={Layers}
        data-cy="portainerSidebar-edgeStacks"
      />
      <SidebarItem
        to="edge.jobs"
        label="Edge Jobs"
        icon={Clock}
        data-cy="portainerSidebar-edgeJobs"
      />
      {isBE && (
        <SidebarItem
          to="edge.devices.waiting-room"
          label="Waiting Room"
          icon={Box}
          data-cy="portainerSidebar-edgeDevicesWaitingRoom"
        />
      )}
    </SidebarSection>
  );
}
