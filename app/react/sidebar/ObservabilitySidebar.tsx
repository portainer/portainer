import { Activity } from 'lucide-react';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

export function ObservabilitySidebar() {
  return (
    <SidebarSection title="Observability">
      <SidebarItem
        label="LogForge"
        to="portainer.logforge"
        icon={Activity}
        data-cy="portainerSidebar-logforge"
      />
    </SidebarSection>
  );
}
