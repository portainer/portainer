import { getNode } from '@/react/docker/proxy/queries/nodes/useNode';
import { getNodes } from '@/react/docker/proxy/queries/nodes/useNodes';
import { updateNode } from '@/react/docker/proxy/queries/nodes/useUpdateNodeMutation';

import { NodeViewModel } from '../models/node';

angular.module('portainer.docker').factory('NodeService', NodeServiceFactory);

/* @ngInject */
function NodeServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    nodes: useAxios(injectEnvironmentId(nodesAngularJS)), // macvlan form + services list + service create + service edit + swarm visualizer + stack edit
    node: useAxios(injectEnvironmentId(nodeAngularJS)), // node browser + node details
    updateNode: useAxios(injectEnvironmentId(updateNodeAngularJS)), // swarm node details panel
  };

  /**
   * @param {EnvironmentId} environmentId
   * @param {NodeId} id
   */
  async function nodeAngularJS(environmentId, id) {
    const data = await getNode(environmentId, id);
    return new NodeViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId
   */
  async function nodesAngularJS(environmentId) {
    const data = await getNodes(environmentId);
    return data.map((n) => new NodeViewModel(n));
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {NodeSpec & { Id: string; Version: number }} nodeConfig
   */
  async function updateNodeAngularJS(environmentId, nodeConfig) {
    return updateNode(environmentId, nodeConfig.Id, nodeConfig, nodeConfig.Version);
  }
}
