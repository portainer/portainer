import { Box } from 'react-feather';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { DashboardLink } from '../items/DashboardLink';
import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: EnvironmentId;
}

export function AzureSidebar({ environmentId }: Props) {
  return (
    <>
      <DashboardLink
        environmentId={environmentId}
        platformPath="azure"
        data-cy="azureSidebar-dashboard"
      />
      <SidebarItem
        to="azure.containerinstances"
        params={{ endpointId: environmentId }}
        icon={Box}
        label="Container instances"
        data-cy="azureSidebar-containerInstances"
      />
    </>
  );
}
