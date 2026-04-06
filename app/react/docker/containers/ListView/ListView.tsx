import { useTranslation } from 'react-i18next';

import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { Environment } from '@/react/portainer/environments/types';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { PageHeader } from '@@/PageHeader';

import { ContainersDatatable } from './ContainersDatatable';

interface Props {
  endpoint: Environment;
}

export function ListView({ endpoint: environment }: Props) {
  const { t } = useTranslation();
  const isAgent = isAgentEnvironment(environment.Type);

  const envInfoQuery = useInfo(environment.Id, {
    select: (info) => !!info.Swarm?.NodeID,
  });

  const isSwarmManager = !!envInfoQuery.data;
  const isHostColumnVisible = isAgent && isSwarmManager;
  return (
    <>
      <PageHeader
        title={t('docker_containers.container_list')}
        breadcrumbs={[{ label: t('docker_containers.title') }]}
        reload
      />

      <ContainersDatatable
        isHostColumnVisible={isHostColumnVisible}
        environment={environment}
      />
    </>
  );
}
