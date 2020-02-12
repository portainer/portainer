import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesDeploymentConverter from 'Kubernetes/converters/deployment';

class KubernetesDeploymentService {
  /* @ngInject */
  constructor($async, KubernetesDeployments) {
    this.$async = $async;
    this.KubernetesDeployments = KubernetesDeployments;

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
        this.KubernetesDeployments(namespace).get(params).$promise,
        this.KubernetesDeployments(namespace).getYaml(params).$promise
      ]);
      const res = {
        Raw: raw,
        Yaml: yaml
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Deployment', err);
    }
  }
  
  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesDeployments(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Deployments', err);
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
  async createAsync(deployment) {
    try {
      const params = {};
      const payload = KubernetesDeploymentConverter.createPayload(deployment);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesDeployments(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create deployment', err);
    }
  }

  create(deployment) {
    return this.$async(this.createAsync, deployment);
  }

  /**
   * DELETE
   */
  async deleteAsync(deployment) {
    try {
      const params = new KubernetesCommonParams();
      params.id = deployment.Name;
      const namespace = deployment.Namespace;
      await this.KubernetesDeployments(namespace).delete(params).$promise
    } catch (err) {
      throw new PortainerError('Unable to remove deployment', err);
    }
  }

  delete(deployment) {
    return this.$async(this.deleteAsync, deployment);
  }
}

export default KubernetesDeploymentService;
angular.module('portainer.kubernetes').service('KubernetesDeploymentService', KubernetesDeploymentService);
