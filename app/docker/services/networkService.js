import { createNetwork } from '@/react/docker/networks/queries/useCreateNetworkMutation';
import { getNetwork } from '@/react/docker/networks/queries/useNetwork';
import { getNetworks } from '@/react/docker/networks/queries/useNetworks';
import { deleteNetwork } from '@/react/docker/networks/queries/useDeleteNetworkMutation';
import { connectContainer } from '@/react/docker/networks/queries/useConnectContainerMutation';

import { NetworkViewModel } from '../models/network';

angular.module('portainer.docker').factory('NetworkService', NetworkServiceFactory);

/* @ngInject */
function NetworkServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    create: useAxios(injectEnvironmentId(createNetwork)), // create network
    network: useAxios(injectEnvironmentId(networkAngularJS)), // service edit
    networks: useAxios(injectEnvironmentId(networksAngularJS)), // macvlan form + container edit + dashboard + service create + service edit + custom templates list + templates list
    remove: useAxios(injectEnvironmentId(deleteNetwork)), // networks list
    connectContainer: useAxios(injectEnvironmentId(connectContainerAngularJS)), // container edit
  };

  /**
   * @param {EnvironmentId} environmentId filled by AngularToReact
   * @param {NetworkId} networkId
   * @param {string?} nodeName
   * @returns NetworkViewModel
   */
  async function networkAngularJS(environmentId, networkId, nodeName) {
    const data = await getNetwork(environmentId, networkId, { nodeName });
    return new NetworkViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId filled by AngularToReact
   * @param {boolean?} localNetworks
   * @param {boolean?} swarmNetworks
   * @param {boolean?} swarmAttachableNetworks
   * @param {*} filters
   * @returns NetworkViewModel[]
   */
  async function networksAngularJS(environmentId, local, swarm, swarmAttachable, filters) {
    const data = await getNetworks(environmentId, { local, swarm, swarmAttachable, filters });
    return data.map((n) => new NetworkViewModel(n));
  }

  /**
   * @param {EnvironmentId} environmentId filled by AngularToReact
   * @param {NetworkId} networkId
   * @param {ContainerId} containerId
   */
  async function connectContainerAngularJS(environmentId, networkId, containerId) {
    return connectContainer({ environmentId, containerId, networkId });
  }
}
