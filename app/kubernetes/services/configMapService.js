import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import KubernetesConfigMapConverter from 'Kubernetes/converters/configMap';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesConfigMapService {
  /* @ngInject */
  constructor($async, KubernetesConfigMaps) {
    this.$async = $async;
    this.KubernetesConfigMaps = KubernetesConfigMaps;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const data = await this.KubernetesConfigMaps(namespace).get(params).$promise;
      return KubernetesConfigMapConverter.apiToConfigMap(data);
    } catch (err) {
      if (err.status === 404) {
        return KubernetesConfigMapConverter.defaultConfigMap(namespace, name);
      }
      throw new PortainerError('Unable to retrieve config map', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesConfigMaps(namespace).get().$promise;
      return _.map(data.items, (item) => KubernetesConfigMapConverter.apiToConfigMap(item));
    } catch (err) {
      throw new PortainerError('Unable to retrieve config maps', err);
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    return this.$async(this.getAllAsync, namespace);
  }

  /**
   * CREATE
   */
  async createAsync(config) {
    try {
      const payload = KubernetesConfigMapConverter.createPayload(config);
      const params = {};
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesConfigMaps(namespace).create(params, payload).$promise;
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
      const params = new KubernetesCommonParams();
      params.id = payload.metadata.name;
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesConfigMaps(namespace).update(params, payload).$promise;
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