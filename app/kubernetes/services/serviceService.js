import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesServiceConverter from 'Kubernetes/converters/service';

class KubernetesServiceService {
  /* @ngInject */
  constructor($async, KubernetesServices) {
    this.$async = $async;
    this.KubernetesServices = KubernetesServices;

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
      const [raw, yaml] = await Promise.all([
        this.KubernetesServices(namespace).get(params).$promise,
        this.KubernetesServices(namespace).getYaml(params).$promise
      ]);
      const res = {
        Raw: raw,
        Yaml: yaml.data
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve service', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesServices(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve services', err);
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
  async createAsync(service) {
    try {
      const params = {};
      const payload = KubernetesServiceConverter.createPayload(service);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesServices(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create service', err);
    }
  }

  create(service) {
    return this.$async(this.createAsync, service);
  }

  /**
   * PATCH
   */
  async patchAsync(deployment) {
    try {
      const params = new KubernetesCommonParams();
      params.id = deployment.Name;
      const namespace = deployment.Namespace;
      const payload = KubernetesServiceConverter.patchPayload(deployment);
      const data = await this.KubernetesServices(namespace).patch(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to patch deployment', err);
    }
  }

  patch(deployment) {
    return this.$async(this.patchAsync, deployment);
  }

  /**
   * DELETE
   */
  async deleteAsync(service) {
    try {
      const params = new KubernetesCommonParams();
      params.id = service.Name;
      const namespace = service.Namespace;
      await this.KubernetesServices(namespace).delete(params).$promise
    } catch (err) {
      throw new PortainerError('Unable to remove service', err);
    }
  }

  delete(service) {
    return this.$async(this.deleteAsync, service);
  }
}

export default KubernetesServiceService;
angular.module('portainer.kubernetes').service('KubernetesServiceService', KubernetesServiceService);
