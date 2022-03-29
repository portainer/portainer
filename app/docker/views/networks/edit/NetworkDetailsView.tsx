import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { useEffect, useState } from 'react';
import DockerNetworkHelper from 'Docker/helpers/networkHelper';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { confirmDeletion } from '@/portainer/services/modal.service/confirm';
import * as notifications from '@/portainer/services/notifications';

import { removeNetwork, isSystemNetwork } from '../network.service';
import { useNetwork } from '../queries';
import { NetworkRowContent, NetworkKey, IPConfigs } from '../types';

import { NetworkDetailsTable } from './NetworkDetailsTable';

const filteredNetworkKeys: NetworkKey[] = [
  'Name',
  'Id',
  'Driver',
  'Scope',
  'Attachable',
  'Internal',
];

export function NetworkDetailsView() {
  const router = useRouter();

  const {
    params: { id: networkId }, // nodeName
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  const { data: network, status, error } = useNetwork(networkId, environmentId);

  const [networkRowContent, setnetworkRowContent] = useState(
    undefined as NetworkRowContent | undefined
  );
  const [allowRemove, setallowRemove] = useState(false);
  const [IPV4Configs, setIPV4Configs] = useState([] as IPConfigs);
  const [IPV6Configs, setIPV6Configs] = useState([] as IPConfigs);

  // update state when network is loaded
  useEffect(() => {
    if (status === 'success') {
      if (network.Name) {
        // transform network object to an array of [key, value] pairs for the table
        setnetworkRowContent(
          filteredNetworkKeys.map((key) => [key, String(network[key])])
        );
        setallowRemove(!isSystemNetwork(network.Name));
      }
      if (network.IPAM) {
        // update the IP configs when the network is updated
        setIPV4Configs(DockerNetworkHelper.getIPV4Configs(network.IPAM.Config));
        setIPV6Configs(DockerNetworkHelper.getIPV6Configs(network.IPAM.Config));
      }
    }

    // notify the error if there is one
    if (status === 'error') {
      notifications.error('Failure', error as Error, 'Unable to get network');
    }
  }, [network, status, error]);

  function onRemoveNetworkClicked() {
    // show a confirmation modal
    const message = 'Do you want to remove the network?';
    confirmDeletion(message, async (confirmed) => {
      if (confirmed) {
        // if comfirmed, remove the network and notify the user
        try {
          await removeNetwork(networkId, environmentId);
          notifications.success('Network successfully removed', network.Name);
          router.stateService.go('docker.networks');
        } catch (err) {
          notifications.error(
            'Failure',
            err as Error,
            'Unable to remove network'
          );
        }
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { link: 'docker.networks', label: 'Networks' },
          { link: 'docker.networks.network', label: network?.Name },
        ]}
      />
      {status === 'success' && (
        <NetworkDetailsTable
          networkRowContent={networkRowContent}
          allowRemove={allowRemove}
          onRemoveNetworkClicked={onRemoveNetworkClicked}
          IPV4Configs={IPV4Configs}
          IPV6Configs={IPV6Configs}
        />
      )}
    </>
  );
}
