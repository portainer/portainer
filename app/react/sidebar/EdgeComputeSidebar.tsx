import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

export function EdgeComputeSidebar() {
  return (
    <SidebarSection title="Edge compute">
      <SidebarItem
        to="edge.devices"
        iconClass="fas fa-laptop-code fa-fw"
        label="Edge Devices"
      />
      <SidebarItem
        to="edge.groups"
        iconClass="fa-object-group fa-fw"
        label="Edge Groups"
      />
      <SidebarItem
        to="edge.stacks"
        iconClass="fa-layer-group fa-fw"
        label="Edge Stacks"
      />
      <SidebarItem
        to="edge.jobs"
        iconClass="fa-clock fa-fw"
        label="Edge Jobs"
      />
    </SidebarSection>
  );
}
