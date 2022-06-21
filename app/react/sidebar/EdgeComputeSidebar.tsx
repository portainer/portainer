import { Box, Clock, Grid, Layers } from 'react-feather';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

export function EdgeComputeSidebar() {
  return (
    <SidebarSection title="Edge compute">
      <SidebarItem to="edge.devices" label="Edge Devices" icon={Box} />
      <SidebarItem to="edge.groups" label="Edge Groups" icon={Grid} />
      <SidebarItem to="edge.stacks" label="Edge Stacks" icon={Layers} />
      <SidebarItem to="edge.jobs" label="Edge Jobs" icon={Clock} />
    </SidebarSection>
  );
}
