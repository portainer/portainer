import { r2a } from '@/react-tools/react2angular';
import { SidebarMenuItem } from '@/portainer/components/sidebar/SidebarMenuItem';
import type { EnvironmentId } from '@/portainer/environments/types';

interface Props {
  environmentId: EnvironmentId;
}

export function AzureSidebar({ environmentId }: Props) {
  return (
    <>
      <SidebarMenuItem
        path="azure.dashboard"
        pathParams={{ endpointId: environmentId }}
        iconClass="fa-tachometer-alt fa-fw"
        className="sidebar-list"
        itemName="Dashboard"
        data-cy="azureSidebar-dashboard"
      >
        Dashboard
      </SidebarMenuItem>
      <SidebarMenuItem
        path="azure.containerinstances"
        pathParams={{ endpointId: environmentId }}
        iconClass="fa-cubes fa-fw"
        className="sidebar-list"
        itemName="ContainerInstances"
        data-cy="azureSidebar-containerInstances"
      >
        Container instances
      </SidebarMenuItem>
    </>
  );
}

export const AzureSidebarAngular = r2a(AzureSidebar, ['environmentId']);
