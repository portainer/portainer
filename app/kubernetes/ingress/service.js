import * as _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import { KubernetesIngressConverter } from './converter';

class KubernetesIngressService {
  /* @ngInject */
  constructor($async, KubernetesIngresses) {
    this.$async = $async;
    this.KubernetesIngresses = KubernetesIngresses;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([this.KubernetesIngresses(namespace).get(params).$promise, this.KubernetesIngresses(namespace).getYaml(params).$promise]);
      const res = {
        Raw: KubernetesIngressConverter.apiToModel(raw),
        Yaml: yaml.data,
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Ingress', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesIngresses(namespace).get().$promise;
      const res = _.reduce(data.items, (arr, item) => _.concat(arr, KubernetesIngressConverter.apiToModel(item)), []);
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Ingresses', err);
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
  async createAsync(formValues) {
    try {
      const params = {};
      const payload = KubernetesIngressConverter.createPayload(formValues);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesIngresses(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create ingress', err);
    }
  }

  create(formValues) {
    return this.$async(this.createAsync, formValues);
  }

  /**
   * PATCH
   */
  async patchAsync(oldIngress, newIngress) {
    try {
      const params = new KubernetesCommonParams();
      params.id = newIngress.Name;
      const namespace = newIngress.Namespace;
      const payload = KubernetesIngressConverter.patchPayload(oldIngress, newIngress);
      if (!payload.length) {
        return;
      }
      const data = await this.KubernetesIngresses(namespace).patch(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to patch ingress', err);
    }
  }

  patch(oldIngress, newIngress) {
    return this.$async(this.patchAsync, oldIngress, newIngress);
  }

  /**
   * DELETE
   */
  async deleteAsync(ingress) {
    try {
      const params = new KubernetesCommonParams();
      params.id = ingress.Name;
      const namespace = ingress.Namespace;
      await this.KubernetesIngresses(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete ingress', err);
    }
  }

  delete(ingress) {
    return this.$async(this.deleteAsync, ingress);
  }
}

export default KubernetesIngressService;
angular.module('portainer.kubernetes').service('KubernetesIngressService', KubernetesIngressService);
