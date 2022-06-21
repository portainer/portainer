import { Layout } from 'react-feather';

import { EnvironmentId } from '@/portainer/environments/types';

import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: EnvironmentId;
  platformPath: string;
}

export function DashboardLink({ environmentId, platformPath }: Props) {
  return (
    <SidebarItem
      to={`${platformPath}.dashboard`}
      params={{ endpointId: environmentId }}
      icon={Layout}
      label="Dashboard"
    />
  );
}
