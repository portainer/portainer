import _ from 'lodash-es';

import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesResourceQuotaConverter from 'Kubernetes/converters/resourceQuota';

class KubernetesResourceQuotaService {
  /* @ngInject */
  constructor($async, KubernetesResourceQuotas) {
    this.$async = $async;
    this.KubernetesResourceQuotas = KubernetesResourceQuotas;

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
      const [raw, yaml] = await Promise.all([this.KubernetesResourceQuotas(namespace).get(params).$promise, this.KubernetesResourceQuotas(namespace).getYaml(params).$promise]);
      return KubernetesResourceQuotaConverter.apiToResourceQuota(raw, yaml);
    } catch (err) {
      throw new PortainerError('Unable to retrieve resource quota', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesResourceQuotas(namespace).get().$promise;
      return _.map(data.items, (item) => KubernetesResourceQuotaConverter.apiToResourceQuota(item));
    } catch (err) {
      throw new PortainerError('Unable to retrieve resource quotas', err);
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
  async createAsync(quota) {
    try {
      const payload = KubernetesResourceQuotaConverter.createPayload(quota);
      const namespace = payload.metadata.namespace;
      const params = {};
      const data = await this.KubernetesResourceQuotas(namespace).create(params, payload).$promise;
      return KubernetesResourceQuotaConverter.apiToResourceQuota(data);
    } catch (err) {
      throw new PortainerError('Unable to create quota', err);
    }
  }

  create(quota) {
    return this.$async(this.createAsync, quota);
  }

  /**
   * UPDATE
   */
  async updateAsync(quota) {
    try {
      const payload = KubernetesResourceQuotaConverter.updatePayload(quota);
      const params = new KubernetesCommonParams();
      params.id = payload.metadata.name;
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesResourceQuotas(namespace).update(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to update resource quota', err);
    }
  }

  update(quota) {
    return this.$async(this.updateAsync, quota);
  }

  /**
   * DELETE
   */
  async deleteAsync(quota) {
    try {
      const params = new KubernetesCommonParams();
      params.id = quota.Name;
      await this.KubernetesResourceQuotas(quota.Namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete quota', err);
    }
  }

  delete(quota) {
    return this.$async(this.deleteAsync, quota);
  }
}

export default KubernetesResourceQuotaService;
angular.module('portainer.kubernetes').service('KubernetesResourceQuotaService', KubernetesResourceQuotaService);
