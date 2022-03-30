import { useRouter, useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

import { useNetwork, useDeleteNetwork } from '../queries';

import { NetworkDetailsTable } from './NetworkDetailsTable';

export function NetworkDetailsView() {
  const router = useRouter();

  const {
    params: { id: networkId }, // nodeName
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  const networkQuery = useNetwork(environmentId, networkId);
  const deleteNetworkMutation = useDeleteNetwork(environmentId, networkId);

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
    const message = 'Do you want to remove the network?';
    const confirmed = await confirmDeletionAsync(message);

    if (confirmed) {
      // networkQuery.
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
