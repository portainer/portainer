import _ from 'lodash-es';

import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesNamespaceConverter from 'Kubernetes/converters/namespace';
import { updateNamespaces } from 'Kubernetes/store/namespace';
import $allSettled from 'Portainer/services/allSettled';

class KubernetesNamespaceService {
  /* @ngInject */
  constructor($async, KubernetesNamespaces) {
    this.$async = $async;
    this.KubernetesNamespaces = KubernetesNamespaces;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
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

  async getAllAsync() {
    try {
      const data = await this.KubernetesNamespaces().get().$promise;
      const promises = _.map(data.items, (item) => this.KubernetesNamespaces().status({ id: item.metadata.name }).$promise);
      const namespaces = await $allSettled(promises);
      const allNamespaces = _.map(namespaces.fulfilled, (item) => {
        return KubernetesNamespaceConverter.apiToNamespace(item);
      });
      updateNamespaces(allNamespaces);
      return allNamespaces;
    } catch (err) {
      throw new PortainerError('Unable to retrieve namespaces', err);
    }
  }

  get(name) {
    if (name) {
      return this.$async(this.getAsync, name);
    }
    return this.$async(this.getAllAsync);
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
