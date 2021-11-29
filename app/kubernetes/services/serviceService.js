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
    this.deleteSingleAsync = this.deleteSingleAsync.bind(this);
    this.deleteAllAsync = this.deleteAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([this.KubernetesServices(namespace).get(params).$promise, this.KubernetesServices(namespace).getYaml(params).$promise]);
      const res = {
        Raw: raw,
        Yaml: yaml.data,
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
  async patchAsync(oldService, newService) {
    try {
      const params = new KubernetesCommonParams();
      params.id = newService.Name;
      const namespace = newService.Namespace;
      const payload = KubernetesServiceConverter.patchPayload(oldService, newService);
      if (!payload.length) {
        return;
      }
      const data = await this.KubernetesServices(namespace).patch(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to patch service', err);
    }
  }

  patch(oldService, newService) {
    return this.$async(this.patchAsync, oldService, newService);
  }

  /**
   * DELETE
   */
  async deleteAsync(services) {
    services.forEach(async (service) => {
      try {
        const params = new KubernetesCommonParams();
        params.id = service.metadata.name;
        const namespace = service.metadata.namespace;
        await this.KubernetesServices(namespace).delete(params).$promise;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('unable to remove service', err);
      }
    });
  }

  delete(services) {
    return this.$async(this.deleteAsync, services);
  }

  async deleteAllAsync(formValuesServices) {
    formValuesServices.forEach(async (service) => {
      try {
        const params = new KubernetesCommonParams();
        params.id = service.Name;
        const namespace = service.Namespace;
        await this.KubernetesServices(namespace).delete(params).$promise;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('unable to remove service', err);
      }
    });
  }

  deleteAll(formValuesServices) {
    return this.$async(this.deleteAllAsync, formValuesServices);
  }

  async deleteSingleAsync(service) {
    try {
      const params = new KubernetesCommonParams();
      params.id = service.Name;
      const namespace = service.Namespace;
      await this.KubernetesServices(namespace).delete(params).$promise;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('unable to remove service', err);
    }
  }

  deleteSingle(service) {
    return this.$async(this.deleteSingleAsync, service);
  }
}

export default KubernetesServiceService;
angular.module('portainer.kubernetes').service('KubernetesServiceService', KubernetesServiceService);
