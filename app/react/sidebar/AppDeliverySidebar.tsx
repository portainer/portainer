import { Database, GitBranch } from 'lucide-react';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

export function AppDeliverySidebar() {
  return (
    <SidebarSection title="App Delivery">
      <SidebarItem
        label="Workflows"
        to="portainer.gitops.workflows"
        icon={GitBranch}
        data-cy="portainerSidebar-workflows"
      />

      <SidebarItem
        label="Sources"
        to="portainer.gitops.sources"
        icon={Database}
        data-cy="portainerSidebar-sources"
      />
    </SidebarSection>
  );
}
