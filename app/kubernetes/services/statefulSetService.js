import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesStatefulSetConverter from 'Kubernetes/converters/statefulSet';

class KubernetesStatefulSetService {
  /* @ngInject */
  constructor($async, KubernetesStatefulSets) {
    this.$async = $async;
    this.KubernetesStatefulSets = KubernetesStatefulSets;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([
        this.KubernetesStatefulSets(namespace).get(params).$promise,
        this.KubernetesStatefulSets(namespace).getYaml(params).$promise
      ]);
      const res = {
        Raw: raw,
        Yaml: yaml
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve StatefulSet', err);
    }
  }
  
  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesStatefulSets(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve StatefulSets', err);
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
  async createAsync(statefulSet) {
    try {
      const params = {};
      const payload = KubernetesStatefulSetConverter.createPayload(statefulSet);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesStatefulSets(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create statefulSet', err);
    }
  }

  create(statefulSet) {
    return this.$async(this.createAsync, statefulSet);
  }

  /**
   * DELETE
   */
  async deleteAsync(statefulSet) {
    try {
      const params = new KubernetesCommonParams();
      params.id = statefulSet.Name;
      const namespace = statefulSet.Namespace;
      await this.KubernetesStatefulSets(namespace).delete(params).$promise
    } catch (err) {
      throw new PortainerError('Unable to remove statefulSet', err);
    }
  }

  delete(statefulSet) {
    return this.$async(this.deleteAsync, statefulSet);
  }
}

export default KubernetesStatefulSetService;
angular.module('portainer.kubernetes').service('KubernetesStatefulSetService', KubernetesStatefulSetService);
