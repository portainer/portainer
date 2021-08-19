import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesNodesLimits } from 'Kubernetes/models/nodes-limits/models';

class KubernetesNodesLimitsService {
  /* @ngInject */
  constructor(KubernetesNodesLimits) {
    this.KubernetesNodesLimits = KubernetesNodesLimits;
  }

  /**
   * GET
   */
  async get() {
    try {
      const nodesLimits = await this.KubernetesNodesLimits.get().$promise;
      return new KubernetesNodesLimits(nodesLimits.data);
    } catch (err) {
      throw new PortainerError('Unable to retrieve nodes limits', err);
    }
  }
}

export default KubernetesNodesLimitsService;
angular.module('portainer.kubernetes').service('KubernetesNodesLimitsService', KubernetesNodesLimitsService);
