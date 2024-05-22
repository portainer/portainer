import { createNetwork } from '@/react/docker/networks/queries/useCreateNetworkMutation';
import { getNetwork } from '@/react/docker/networks/queries/useNetwork';
import { getNetworks } from '@/react/docker/networks/queries/useNetworks';
import { deleteNetwork } from '@/react/docker/networks/queries/useDeleteNetworkMutation';
import { disconnectContainer } from '@/react/docker/networks/queries/useDisconnectContainerMutation';
import { connectContainer } from '@/react/docker/networks/queries/useConnectContainerMutation';

import { NetworkViewModel } from '../models/network';

angular.module('portainer.docker').factory('NetworkService', NetworkServiceFactory);

/* @ngInject */
function NetworkServiceFactory(AngularToReact) {
  return {
    create: AngularToReact.useAxios(createNetwork), // create network
    network: AngularToReact.useAxios(networkAngularJS), // service edit
    networks: AngularToReact.useAxios(networksAngularJS), // macvlan form + container edit + dashboard + service create + service edit + custom templates list + templates list
    remove: AngularToReact.useAxios(deleteNetwork), // networks list
    disconnectContainer: AngularToReact.useAxios(disconnectContainer), // container edit
    connectContainer: AngularToReact.useAxios(connectContainerAngularJS), // container edit
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
