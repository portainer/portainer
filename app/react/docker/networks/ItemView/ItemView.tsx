import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from 'react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { DockerContainer } from '@/react/docker/containers/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { useContainers } from '@/react/docker/containers/queries/containers';

import { confirmDelete } from '@@/modals/confirm';
import { PageHeader } from '@@/PageHeader';

import { useNetwork, useDeleteNetwork } from '../queries';
import { isSystemNetwork } from '../network.helper';
import { NetworkResponseContainers } from '../types';

import { NetworkDetailsTable } from './NetworkDetailsTable';
import { NetworkOptionsTable } from './NetworkOptionsTable';
import { NetworkContainersTable } from './NetworkContainersTable';

export function ItemView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    params: { id: networkId, nodeName },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();
  const networkQuery = useNetwork(environmentId, networkId, { nodeName });
  const deleteNetworkMutation = useDeleteNetwork();
  const containersQuery = useContainers(environmentId, {
    filters: {
      network: [networkId],
    },
    nodeName,
  });

  if (!networkQuery.data) {
    return null;
  }

  const network = networkQuery.data;

  const networkContainers = filterContainersInNetwork(
    network.Containers,
    containersQuery.data
  );
  const resourceControl = network.Portainer?.ResourceControl
    ? new ResourceControlViewModel(network.Portainer.ResourceControl)
    : undefined;

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { link: 'docker.networks', label: 'Networks' },
          {
            link: 'docker.networks.network',
            label: networkQuery.data.Name,
          },
        ]}
      />
      <NetworkDetailsTable
        network={networkQuery.data}
        onRemoveNetworkClicked={onRemoveNetworkClicked}
      />

      <AccessControlPanel
        onUpdateSuccess={() =>
          queryClient.invalidateQueries([
            'environments',
            environmentId,
            'docker',
            'networks',
            networkId,
          ])
        }
        resourceControl={resourceControl}
        resourceType={ResourceControlType.Network}
        disableOwnershipChange={isSystemNetwork(networkQuery.data.Name)}
        resourceId={networkId}
        environmentId={environmentId}
      />
      <NetworkOptionsTable options={networkQuery.data.Options} />
      <NetworkContainersTable
        networkContainers={networkContainers}
        nodeName={nodeName}
        environmentId={environmentId}
        networkId={networkId}
      />
    </>
  );

  async function onRemoveNetworkClicked() {
    const message = 'Do you want to delete the network?';
    const confirmed = await confirmDelete(message);

    if (confirmed) {
      deleteNetworkMutation.mutate(
        { environmentId, networkId },
        {
          onSuccess: () => {
            router.stateService.go('docker.networks');
          },
        }
      );
    }
  }
}

function filterContainersInNetwork(
  networkContainers?: NetworkResponseContainers,
  containers: DockerContainer[] = []
) {
  if (!networkContainers) {
    return [];
  }

  return containers
    .filter((container) => networkContainers[container.Id])
    .map((container) => ({
      ...networkContainers[container.Id],
      Id: container.Id,
    }));
}
