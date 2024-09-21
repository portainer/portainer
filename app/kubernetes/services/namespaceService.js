import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesNamespaceConverter from 'Kubernetes/converters/namespace';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { updateNamespaces } from 'Kubernetes/store/namespace';

class KubernetesNamespaceService {
  /* @ngInject */
  constructor($async, KubernetesNamespaces, Authentication, LocalStorage, $state) {
    this.$async = $async;
    this.$state = $state;
    this.KubernetesNamespaces = KubernetesNamespaces;
    this.LocalStorage = LocalStorage;
    this.Authentication = Authentication;

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
      // get the list of all namespaces with isAccessAllowed flags
      const hasK8sAccessSystemNamespaces = this.Authentication.hasAuthorizations(['K8sAccessSystemNamespaces']);
      const namespaces = data.items.filter((item) => !KubernetesNamespaceHelper.isSystemNamespace(item.metadata.name) || hasK8sAccessSystemNamespaces);
      // parse the namespaces
      const visibleNamespaces = namespaces.map((item) => KubernetesNamespaceConverter.apiToNamespace(item));
      updateNamespaces(visibleNamespaces);
      return visibleNamespaces;
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
