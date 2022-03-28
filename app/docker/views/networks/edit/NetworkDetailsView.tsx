import { useCurrentStateAndParams } from '@uirouter/react';
import { useEffect, useState } from 'react';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';

import { NetworkDetailsTable } from './NetworkDetailsTable';
import { getNetwork, isSystemNetwork } from './network.service'; // removeNetwork
import {
  NetworkId,
  DockerNetwork,
  NetworkRowContent,
  NetworkKey,
} from './types';

const filteredNetworkKeys: NetworkKey[] = [
  'Name',
  'Id',
  'Driver',
  'Scope',
  'Attachable',
  'Internal',
];

export function NetworkDetailsView() {
  const [network, setNetwork] = useState({
    Attachable: false,
    Driver: '',
    Id: '',
    Internal: false,
    Name: '',
    Scope: '',
  } as DockerNetwork);
  const [networkRowContent, setnetworkRowContent] = useState(
    undefined as NetworkRowContent | undefined
  );
  const [allowRemove, setallowRemove] = useState(false);
  const {
    params: { id: networkId }, // nodeName
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  // when the network id changes, update the network data
  useEffect(() => {
    async function fetchNetwork(networkId: NetworkId, environmentId: string) {
      const data = await getNetwork(networkId, environmentId);
      setNetwork(data);
    }

    if (networkId) {
      fetchNetwork(networkId, environmentId);
    }
  }, [networkId, environmentId]);

  useEffect(() => {
    // transform network object to an array of [key, value] pairs for the table
    function setnetworkRowContentFn() {
      setnetworkRowContent(
        filteredNetworkKeys.map((key) => [key, String(network[key])])
      );
    }

    if (network.Name) {
      setnetworkRowContentFn();
      // decide if removing is allowed
      setallowRemove(!isSystemNetwork(network.Name));
    }
  }, [network]);

  function onRemoveNetwork() {
    // show a confirmation modal
    // on confirmation, remove the network
    console.log(networkId);
  }

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { link: 'docker.networks', label: 'Networks' },
          { link: 'docker.networks.network', label: network.Name }, // TODO: replace with network name
        ]}
      />
      <NetworkDetailsTable
        networkRowContent={networkRowContent}
        allowRemove={allowRemove}
        onRemoveNetwork={onRemoveNetwork}
      />
    </>
  );
}
