import angular from 'angular';
import PortainerError from 'Portainer/error';

class KubernetesReplicaSetService {
  /* @ngInject */
  constructor($async, KubernetesReplicaSets) {
    this.$async = $async;
    this.KubernetesReplicaSets = KubernetesReplicaSets;

    this.getAllAsync = this.getAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesReplicaSets(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve ReplicaSets', err);
    }
  }

  get(namespace) {
    return this.$async(this.getAllAsync, namespace);
  }
}

export default KubernetesReplicaSetService;
angular.module('portainer.kubernetes').service('KubernetesReplicaSetService', KubernetesReplicaSetService);
