import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesDaemonSetConverter from 'Kubernetes/converters/daemonSet';

class KubernetesDaemonSetService {
  /* @ngInject */
  constructor($async, KubernetesDaemonSets) {
    this.$async = $async;
    this.KubernetesDaemonSets = KubernetesDaemonSets;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
    this.rollbackAsync = this.rollbackAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([this.KubernetesDaemonSets(namespace).get(params).$promise, this.KubernetesDaemonSets(namespace).getYaml(params).$promise]);
      const res = {
        Raw: raw,
        Yaml: yaml.data,
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve DaemonSet', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesDaemonSets(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve DaemonSets', err);
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
  async createAsync(daemonSet) {
    try {
      const params = {};
      const payload = KubernetesDaemonSetConverter.createPayload(daemonSet);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesDaemonSets(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create daemonset', err);
    }
  }

  create(daemonSet) {
    return this.$async(this.createAsync, daemonSet);
  }

  /**
   * PATCH
   */
  async patchAsync(oldDaemonSet, newDaemonSet) {
    try {
      const params = new KubernetesCommonParams();
      params.id = newDaemonSet.Name;
      const namespace = newDaemonSet.Namespace;
      const payload = KubernetesDaemonSetConverter.patchPayload(oldDaemonSet, newDaemonSet);
      if (!payload.length) {
        return;
      }
      const data = await this.KubernetesDaemonSets(namespace).patch(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to patch daemonSet', err);
    }
  }

  patch(oldDaemonSet, newDaemonSet) {
    return this.$async(this.patchAsync, oldDaemonSet, newDaemonSet);
  }

  /**
   * DELETE
   */
  async deleteAsync(daemonSet) {
    try {
      const params = new KubernetesCommonParams();
      params.id = daemonSet.Name;
      const namespace = daemonSet.Namespace;
      await this.KubernetesDaemonSets(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to remove daemonset', err);
    }
  }

  delete(daemonSet) {
    return this.$async(this.deleteAsync, daemonSet);
  }

  /**
   * ROLLBACK
   */
  async rollbackAsync(namespace, name, payload) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      await this.KubernetesDaemonSets(namespace).rollback(params, payload).$promise;
    } catch (err) {
      throw new PortainerError('Unable to rollback daemonset', err);
    }
  }

  rollback(namespace, name, payload) {
    return this.$async(this.rollbackAsync, namespace, name, payload);
  }
}

export default KubernetesDaemonSetService;
angular.module('portainer.kubernetes').service('KubernetesDaemonSetService', KubernetesDaemonSetService);
