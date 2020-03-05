import angular from 'angular';
import PortainerError from 'Portainer/error';
import KubernetesSecretConverter from 'Kubernetes/converters/secret';

class KubernetesSecretService {
  /* @ngInject */
  constructor($async, KubernetesSecrets) {
    this.$async = $async;
    this.KubernetesSecrets = KubernetesSecrets;

    this.createAsync = this.createAsync.bind(this);
  }

  /**
   * CREATE
   */
  async createAsync(secret) {
    try {
      const payload = KubernetesSecretConverter.createPayload(secret);
      const namespace = payload.metadata.namespace;
      const params = {};
      const data = await this.KubernetesSecrets(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create secret', err);
    }
  }

  create(secret) {
    return this.$async(this.createAsync, secret);
  }
}

export default KubernetesSecretService;
angular.module('portainer.kubernetes').service('KubernetesSecretService', KubernetesSecretService);

