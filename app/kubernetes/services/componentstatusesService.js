import angular from 'angular';
import PortainerError from 'Portainer/error';

class KubernetesComponentStatusesService {
  /* @ngInject */
  constructor($async, KubernetesComponentStatuses) {
    this.$async = $async;
    this.KubernetesComponentStatuses = KubernetesComponentStatuses;

    this.getAsync = this.getAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync() {
    try {
      const data = await this.KubernetesComponentStatuses().get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve cluster status', err);
    }
  }

  get() {
    return this.$async(this.getAsync);
  }
}

export default KubernetesComponentStatusesService;
angular.module('portainer.kubernetes').service('KubernetesComponentStatusesService', KubernetesComponentStatusesService);
