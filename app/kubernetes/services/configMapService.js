import angular from 'angular';

import PortainerError from 'Portainer/error';
import KubernetesConfigMapConverter from 'Kubernetes/converters/configMap';

class KubernetesConfigMapService {
  /* @ngInject */
  constructor($async, KubernetesConfigMaps) {
    this.$async = $async;
    this.KubernetesConfigMaps = KubernetesConfigMaps;

    this.getAsync = this.getAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const payload = KubernetesConfigMapConverter.getPayload(name);
      const data = await this.KubernetesConfigMaps(namespace).get(payload).$promise;
      return KubernetesConfigMapConverter.apiToConfigMap(data);
    } catch (err) {
      if (err.status === 404) {
        return KubernetesConfigMapConverter.defaultConfigMap(namespace, name);
      }
      throw new PortainerError('Unable to retrieve config map', err);
    }
  }

  get(namespace, name) {
    return this.$async(this.getAsync, namespace, name);
  }


  /**
   * CREATE
   */
  async createAsync(config) {
    try {
      const payload = KubernetesConfigMapConverter.createPayload(config);
      const data = await this.KubernetesConfigMaps(config.Namespace).create(payload).$promise;
      return KubernetesConfigMapConverter.apiToConfigMap(data);
    } catch (err) {
      throw new PortainerError('Unable to create config map', err);
    }
  }

  create(config) {
    return this.$async(this.createAsync, config);
  }

  /**
   * UPDATE
   */
  async updateAsync(config) {
    try {
      if (!config.Id) {
        return await this.create(config);
      }
      const payload = KubernetesConfigMapConverter.updatePayload(config);
      const data = await this.KubernetesConfigMaps(config.Namespace).update(payload).$promise;
      return KubernetesConfigMapConverter.apiToConfigMap(data);
    } catch (err) {
      throw new PortainerError('Unable to update config map', err);
    }
  }
  update(config) {
    return this.$async(this.updateAsync, config);
  }
}

export default KubernetesConfigMapService;
angular.module('portainer.kubernetes').service('KubernetesConfigMapService', KubernetesConfigMapService);