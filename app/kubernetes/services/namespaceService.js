import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesNamespaceConverter from 'Kubernetes/converters/namespace';
import { updateNamespaces } from 'Kubernetes/store/namespace';
import $allSettled from 'Portainer/services/allSettled';

class KubernetesNamespaceService {
  /* @ngInject */
  constructor($async, KubernetesNamespaces, LocalStorage) {
    this.$async = $async;
    this.KubernetesNamespaces = KubernetesNamespaces;
    this.LocalStorage = LocalStorage;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
    this.getJSONAsync = this.getJSONAsync.bind(this);
    this.updateFinalizeAsync = this.updateFinalizeAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      await this.KubernetesNamespaces().status(params).$promise;
      const [raw, yaml] = await Promise.all([this.KubernetesNamespaces().get(params).$promise, this.KubernetesNamespaces().getYaml(params).$promise]);
      const ns = KubernetesNamespaceConverter.apiToNamespace(raw, yaml);
      updateNamespaces([ns]);
      return ns;
    } catch (err) {
      throw new PortainerError('Unable to retrieve namespace', err);
    }
  }

  /**
   * GET namesspace in JSON format
   */
  async getJSONAsync(name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      await this.KubernetesNamespaces().status(params).$promise;
      return await this.KubernetesNamespaces().getJSON(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve namespace', err);
    }
  }

  /**
   * Update finalize
   */
  async updateFinalizeAsync(namespace) {
    try {
      return await this.KubernetesNamespaces().update({ id: namespace.metadata.name, action: 'finalize' }, namespace).$promise;
    } catch (err) {
      throw new PortainerError('Unable to update namespace', err);
    }
  }

  async getAllAsync() {
    try {
      // get the list of all namespaces (RBAC allows users to see the list of namespaces)
      const data = await this.KubernetesNamespaces().get().$promise;
      // get the status of each namespace (RBAC will give permission denied for status of unauthorised namespaces)
      const promises = data.items.map((item) => this.KubernetesNamespaces().status({ id: item.metadata.name }).$promise);
      const namespaces = await $allSettled(promises);
      // only return namespaces if the user has access to namespaces
      const allNamespaces = namespaces.fulfilled.map((item) => {
        return KubernetesNamespaceConverter.apiToNamespace(item);
      });
      updateNamespaces(allNamespaces);
      return allNamespaces;
    } catch (err) {
      throw new PortainerError('Unable to retrieve namespaces', err);
    }
  }

  async get(name) {
    if (name) {
      return this.$async(this.getAsync, name);
    }
    const allowedNamespaces = await this.getAllAsync();
    updateNamespaces(allowedNamespaces);
    return allowedNamespaces;
  }

  /**
   * CREATE
   */
  async createAsync(namespace) {
    try {
      const payload = KubernetesNamespaceConverter.createPayload(namespace);
      const params = {};
      const data = await this.KubernetesNamespaces().create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create namespace', err);
    }
  }

  create(namespace) {
    return this.$async(this.createAsync, namespace);
  }

  /**
   * DELETE
   */
  async deleteAsync(namespace) {
    try {
      const params = new KubernetesCommonParams();
      params.id = namespace.Name;
      await this.KubernetesNamespaces().delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete namespace', err);
    }
  }

  delete(namespace) {
    return this.$async(this.deleteAsync, namespace);
  }
}

export default KubernetesNamespaceService;
angular.module('portainer.kubernetes').service('KubernetesNamespaceService', KubernetesNamespaceService);
