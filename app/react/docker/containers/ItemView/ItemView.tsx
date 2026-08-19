import { useCurrentStateAndParams } from '@uirouter/react';

import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { trimContainerName } from '@/docker/filters/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { Registry } from '@/react/portainer/registries/types/registry';

import { PageHeader } from '@@/PageHeader';
import { findBestMatchRegistry } from '@@/ImageConfigFieldset/findRegistryMatch';

import { useContainer } from '../queries/useContainer';

import { ContainerActionsSection } from './ContainerActionsSection/ContainerActionsSection';
import { ContainerStatusSection } from './ContainerStatusSection/ContainerStatusSection';
import { CreateImageSection } from './CreateImageSection/CreateImageSection';
import { ContainerDetailsSection } from './ContainerDetailsSection/ContainerDetailsSection';
import { VolumesSection } from './VolumesSection/VolumesSection';
import { ContainerNetworksDatatable } from './ContainerNetworksDatatable';
import { HealthStatus } from './HealthStatus';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id: containerId, nodeName },
  } = useCurrentStateAndParams();

  const containerQuery = useContainer(
    { environmentId, containerId, nodeName },
    { select: (c) => new ContainerDetailsViewModel(c) }
  );

  const registriesQuery = useEnvironmentRegistries(environmentId);

  if (
    containerQuery.isLoading ||
    !containerQuery.data ||
    !registriesQuery.data
  ) {
    return null;
  }

  const container = containerQuery.data;
  const registryId = getRegistryId(container, registriesQuery.data);

  async function handleSuccess() {
    containerQuery.refetch();
  }

  const containerName =
    trimContainerName(container.Name) || container.Id || 'unknown';

  return (
    <>
      <PageHeader
        title="Container details"
        breadcrumbs={[
          { label: 'Containers', link: 'docker.containers' },
          containerName,
        ]}
      />

      <div className="mx-4 mb-4 space-y-4 [&>*]:block">
        <ContainerActionsSection
          environmentId={environmentId}
          nodeName={nodeName}
          container={container}
        />

        <ContainerStatusSection
          environmentId={environmentId}
          nodeName={nodeName}
          container={container}
          registryId={registryId}
        />
      </div>

      <AccessControlPanel
        resourceId={container.Id || ''}
        resourceControl={container.ResourceControl}
        resourceType={ResourceControlType.Container}
        onUpdateSuccess={handleSuccess}
        environmentId={environmentId}
      />

      {container.State?.Health && (
        <HealthStatus health={container.State.Health} />
      )}

      <div className="mx-4 mb-4 space-y-4 [&>*]:block">
        <CreateImageSection
          environmentId={environmentId}
          containerId={container.Id || ''}
        />

        <ContainerDetailsSection
          environmentId={environmentId}
          container={container}
          nodeName={nodeName}
        />

        <VolumesSection volumes={container.Mounts} nodeName={nodeName} />
      </div>

      {container.NetworkSettings?.Networks && (
        <ContainerNetworksDatatable
          dataset={container.NetworkSettings.Networks}
          containerId={containerId}
          nodeName={nodeName}
        />
      )}
    </>
  );
}

function getRegistryId(
  container: ContainerDetailsViewModel,
  registries?: Array<Registry>
) {
  const imageName = container.Config?.Image;
  if (!imageName || !registries) {
    return undefined;
  }

  const registry = findBestMatchRegistry(imageName, registries);
  return registry?.Id;
}
