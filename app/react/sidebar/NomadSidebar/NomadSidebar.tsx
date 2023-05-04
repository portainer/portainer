import { Clock } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { DashboardLink } from '../items/DashboardLink';
import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: EnvironmentId;
}

export function NomadSidebar({ environmentId }: Props) {
  return (
    <>
      <DashboardLink
        environmentId={environmentId}
        platformPath="nomad"
        data-cy="nomadSidebar-dashboard"
      />

      <SidebarItem
        to="nomad.jobs"
        params={{ endpointId: environmentId }}
        icon={Clock}
        label="Nomad Jobs"
        data-cy="nomadSidebar-jobs"
      />
    </>
  );
}
