import angular from 'angular';
import PortainerError from 'Portainer/error';

class KubernetesControllerRevisionService {
  /* @ngInject */
  constructor($async, KubernetesControllerRevisions) {
    this.$async = $async;
    this.KubernetesControllerRevisions = KubernetesControllerRevisions;

    this.getAllAsync = this.getAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesControllerRevisions(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve ControllerRevisions', err);
    }
  }

  get(namespace) {
    return this.$async(this.getAllAsync, namespace);
  }
}

export default KubernetesControllerRevisionService;
angular.module('portainer.kubernetes').service('KubernetesControllerRevisionService', KubernetesControllerRevisionService);
