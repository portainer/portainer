import { Database } from 'react-feather';

import { EnvironmentId } from '@/portainer/environments/types';

import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: EnvironmentId;
  platformPath: string;
}

export function VolumesLink({ environmentId, platformPath }: Props) {
  return (
    <SidebarItem
      to={`${platformPath}.volumes`}
      params={{ endpointId: environmentId }}
      icon={Database}
      label="Volumes"
    />
  );
}
