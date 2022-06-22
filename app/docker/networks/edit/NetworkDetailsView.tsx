import { useState, useEffect } from 'react';
import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from 'react-query';
import _ from 'lodash';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';
import { AccessControlPanel } from '@/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/portainer/access-control/types';
import { DockerContainer } from '@/docker/containers/types';
import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

import { PageHeader } from '@@/PageHeader';

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

  const [networkContainers, setNetworkContainers] = useState<
    NetworkContainer[]
  >([]);
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
      setNetworkContainers(
        filterContainersInNetwork(networkQuery.data, containersQuery.data)
      );
    }
  }, [networkQuery.data, containersQuery.data]);

  if (!networkQuery.data) {
    return null;
  }

  const network = networkQuery.data;

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
    const containersInNetwork = _.compact(
      containers.map((container) => {
        const containerInNetworkResponse = network.Containers[container.Id];
        if (containerInNetworkResponse) {
          const containerInNetwork: NetworkContainer = {
            ...containerInNetworkResponse,
            Id: container.Id,
          };
          return containerInNetwork;
        }
        return null;
      })
    );
    return containersInNetwork;
  }
}
