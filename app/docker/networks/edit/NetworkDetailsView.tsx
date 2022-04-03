import { useState, useEffect } from 'react';
import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from 'react-query';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';
import { AccessControlPanel } from '@/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/portainer/access-control/types';
import { DockerContainer } from '@/docker/containers/types';

import { useNetwork, useDeleteNetwork } from '../queries';
import { isSystemNetwork } from '../network.helper';
import { useContainers } from '../../containers/queries';
import { DockerNetwork, NetworkContainer } from '../types';

import { NetworkDetailsTable } from './NetworkDetailsTable';
import { NetworkOptionsTable } from './NetworkOptionsTable';
import { NetworkContainersTable } from './NetworkContainersTable';

export function NetworkDetailsView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filteredNetworkContainers, setFilteredNetworkContainers] = useState(
    [] as NetworkContainer[]
  );
  const {
    params: { id: networkId, nodeName },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  const networkQuery = useNetwork(environmentId, networkId);
  const deleteNetworkMutation = useDeleteNetwork();
  const filters = {
    network: [networkId],
  };
  const containersQuery = useContainers(environmentId, filters);

  useEffect(() => {
    if (networkQuery.data && containersQuery.data) {
      setFilteredNetworkContainers(
        filterContainersInNetwork(networkQuery.data, containersQuery.data)
      );
    }
  }, [networkQuery.data, containersQuery.data]);

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { link: 'docker.networks', label: 'Networks' },
          {
            link: 'docker.networks.network',
            label: networkQuery.data?.Name || '',
          },
        ]}
      />
      {networkQuery.data && (
        <>
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
            resourceControl={networkQuery.data.Portainer?.ResourceControl}
            resourceType={ResourceControlType.Network}
            disableOwnershipChange={isSystemNetwork(networkQuery.data.Name)}
            resourceId={networkId}
          />
        </>
      )}
      {networkQuery.data?.Options &&
        Object.keys(networkQuery.data.Options).length > 0 && (
          <NetworkOptionsTable options={networkQuery.data.Options} />
        )}
      {filteredNetworkContainers && filteredNetworkContainers.length > 0 && (
        <NetworkContainersTable
          networkContainers={filteredNetworkContainers}
          nodeName={nodeName}
          environmentId={environmentId}
          networkId={networkId}
        />
      )}
    </>
  );

  async function onRemoveNetworkClicked() {
    const message = 'Do you want to delete the network?';
    const confirmed = await confirmDeletionAsync(message);

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

  function filterContainersInNetwork(
    network: DockerNetwork,
    containers: DockerContainer[]
  ) {
    const containersInNetwork: NetworkContainer[] = [];
    containers.forEach((container) => {
      const containerInNetwork =
        network.Containers && network.Containers[container.Id];
      if (containerInNetwork) {
        containerInNetwork.Id = container.Id;
        containersInNetwork.push(containerInNetwork);
      }
    });
    return containersInNetwork;
  }
}
