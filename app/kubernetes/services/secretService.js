import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import KubernetesSecretConverter from 'Kubernetes/converters/secret';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesSecretService {
  /* @ngInject */
  constructor($async, KubernetesSecrets) {
    this.$async = $async;
    this.KubernetesSecrets = KubernetesSecrets;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([this.KubernetesSecrets(namespace).get(params).$promise, this.KubernetesSecrets(namespace).getYaml(params).$promise]);
      const secret = KubernetesSecretConverter.apiToSecret(raw, yaml);
      return secret;
    } catch (err) {
      throw new PortainerError('Unable to retrieve secret', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesSecrets(namespace).get().$promise;
      return _.map(data.items, (item) => KubernetesSecretConverter.apiToSecret(item));
    } catch (err) {
      throw new PortainerError('Unable to retrieve secrets', err);
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
  async createAsync(secret) {
    try {
      const payload = KubernetesSecretConverter.createPayload(secret);
      const namespace = payload.metadata.namespace;
      const params = {};
      const data = await this.KubernetesSecrets(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create secret', err);
    }
  }

  create(secret) {
    return this.$async(this.createAsync, secret);
  }

  /**
   * UPDATE
   */
  async updateAsync(secret) {
    try {
      const payload = KubernetesSecretConverter.updatePayload(secret);
      const params = new KubernetesCommonParams();
      params.id = payload.metadata.name;
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesSecrets(namespace).update(params, payload).$promise;
      return KubernetesSecretConverter.apiToSecret(data);
    } catch (err) {
      throw new PortainerError('Unable to update secret', err);
    }
  }

  update(secret) {
    return this.$async(this.updateAsync, secret);
  }

  /**
   * DELETE
   */
  async deleteAsync(secret) {
    try {
      const params = new KubernetesCommonParams();
      params.id = secret.Name;
      const namespace = secret.Namespace;
      await this.KubernetesSecrets(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete secret', err);
    }
  }

  delete(secret) {
    return this.$async(this.deleteAsync, secret);
  }
}

export default KubernetesSecretService;
angular.module('portainer.kubernetes').service('KubernetesSecretService', KubernetesSecretService);
