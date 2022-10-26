import { useInfo } from '@/docker/services/system.service';
import { Environment } from '@/react/portainer/environments/types';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { PageHeader } from '@@/PageHeader';

import { ContainersDatatable } from './ContainersDatatable';

interface Props {
  endpoint: Environment;
}

export function ListView({ endpoint: environment }: Props) {
  const isAgent = isAgentEnvironment(environment.Type);

  const envInfoQuery = useInfo(environment.Id, (info) => !!info.Swarm?.NodeID);

  const isSwarmManager = !!envInfoQuery.data;
  const isHostColumnVisible = isAgent && isSwarmManager;
  return (
    <>
      <PageHeader
        title="Container list"
        breadcrumbs={[{ label: 'Containers' }]}
        reload
      />

      <ContainersDatatable
        isHostColumnVisible={isHostColumnVisible}
        environment={environment}
      />
    </>
  );
}
