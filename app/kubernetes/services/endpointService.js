import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';
import KubernetesEndpointConverter from 'Kubernetes/converters/endpoint';

class KubernetesEndpointService {
  /* @ngInject */
  constructor($async, KubernetesEndpoints) {
    this.$async = $async;
    this.KubernetesEndpoints = KubernetesEndpoints;

    this.getAllAsync = this.getAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesEndpoints(namespace).get().$promise;
      return _.map(data.items, (item) => {
        return KubernetesEndpointConverter.apiToEndpoint(item);
      });
    } catch (err) {
      throw new PortainerError('Unable to retrieve events', err);
    }
  }

  get(namespace) {
    return this.$async(this.getAllAsync, namespace);
  }
}

export default KubernetesEndpointService;
angular.module('portainer.kubernetes').service('KubernetesEndpointService', KubernetesEndpointService);
