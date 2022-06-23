import { EnvironmentId } from '@/portainer/environments/types';

import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: EnvironmentId;
}

export function AzureSidebar({ environmentId }: Props) {
  return (
    <>
      <SidebarItem
        to="azure.dashboard"
        params={{ endpointId: environmentId }}
        iconClass="fa-tachometer-alt fa-fw"
        label="Dashboard"
      />
      <SidebarItem
        to="azure.containerinstances"
        params={{ endpointId: environmentId }}
        iconClass="fa-cubes fa-fw"
        label="Container instances"
      />
    </>
  );
}
