import angular from 'angular';
import PortainerError from 'Portainer/error';

class KubernetesHealthService {
  /* @ngInject */
  constructor($async, KubernetesHealth) {
    this.$async = $async;
    this.KubernetesHealth = KubernetesHealth;

    this.pingAsync = this.pingAsync.bind(this);
  }

  /**
   * PING
   */
  async pingAsync(endpointID) {
    try {
      return await this.KubernetesHealth.ping({ id: endpointID }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve environment health', err);
    }
  }

  ping(endpointID) {
    return this.$async(this.pingAsync, endpointID);
  }
}

export default KubernetesHealthService;
angular.module('portainer.kubernetes').service('KubernetesHealthService', KubernetesHealthService);
