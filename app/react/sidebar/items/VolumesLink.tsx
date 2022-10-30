import { Database } from 'react-feather';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { AutomationTestingProps } from '@/types';

import { SidebarItem } from '../SidebarItem';

interface Props extends AutomationTestingProps {
  environmentId: EnvironmentId;
  platformPath: string;
}

export function VolumesLink({
  environmentId,
  platformPath,
  'data-cy': dataCy,
}: Props) {
  return (
    <SidebarItem
      to={`${platformPath}.volumes`}
      params={{ endpointId: environmentId }}
      icon={Database}
      label="Volumes"
      data-cy={dataCy}
    />
  );
}
