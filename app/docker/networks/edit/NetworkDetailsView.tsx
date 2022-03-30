import { useRouter, useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';
import * as notifications from '@/portainer/services/notifications';
// import { AccessControlPanel } from '@/portainer/access-control/AccessControlPanel/AccessControlPanel';

import { removeNetwork } from '../network.service';
import { useNetwork } from '../queries';

import { NetworkDetailsTable } from './NetworkDetailsTable';

export function NetworkDetailsView() {
  const router = useRouter();

  const {
    params: { id: networkId }, // nodeName
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  const networkQuery = useNetwork(environmentId, networkId);

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { link: 'docker.networks', label: 'Networks' },
          { link: 'docker.networks.network', label: networkQuery.data?.Name },
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

    if (confirm) {
      try {
        await removeNetwork(networkId, environmentId);
        notifications.success(
          'Network successfully removed',
          networkQuery.data.Name
        );
        router.stateService.go('docker.networks');
      } catch (err) {
        notifications.error(
          'Failure',
          err as Error,
          'Unable to remove network'
        );
      }
    }
  }
}
