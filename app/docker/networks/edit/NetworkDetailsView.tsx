import { useRouter, useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

import { useNetwork, UseDeleteNetwork } from '../queries';

import { NetworkDetailsTable } from './NetworkDetailsTable';

export function NetworkDetailsView() {
  const router = useRouter();

  const {
    params: { id: networkId }, // nodeName
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  const networkQuery = useNetwork(environmentId, networkId);
  const deleteNetworkQuery = UseDeleteNetwork(environmentId, networkId);

  // if the network deletes, then take the user back to the list of networks
  // this isn't in the onSuccess callback because navigation should be specific to the component
  if (deleteNetworkQuery.isSuccess) {
    router.stateService.go('docker.networks');
  }

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
          {/* <AccessControlPanel
            resourceControl={}
            resourceType={}
            disableOwnershipChange={}
            resourceId={network.Id}
            onUpdateSuccess={}
          /> */}
        </>
      )}
    </>
  );

  async function onRemoveNetworkClicked() {
    // show a confirmation modal
    const message = 'Do you want to remove the network?';
    const confirm = await confirmDeletionAsync(message);

    // if confirmed, delete the network by invoking the useDeleteNetwork (useMutate) hook
    if (confirm) {
      deleteNetworkQuery.mutate(environmentId, networkId);
    }
  }
}
