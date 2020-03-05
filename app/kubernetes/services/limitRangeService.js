import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesLimitRangeConverter from 'Kubernetes/converters/limitRange';

class KubernetesLimitRangeService {
  /* @ngInject */
  constructor($async, KubernetesLimitRanges) {
    this.$async = $async;
    this.KubernetesLimitRanges = KubernetesLimitRanges;

    this.getAsync = this.getAsync.bind(this);
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
        this.KubernetesLimitRanges(namespace).get(params).$promise,
        this.KubernetesLimitRanges(namespace).getYaml(params).$promise
      ]);
      return KubernetesLimitRangeConverter.apiToLimitRange(raw, yaml);
    } catch (err) {
      throw new PortainerError('Unable to retrieve limit range', err);
    }
  }

  get(namespace, name) {
    return this.$async(this.getAsync, namespace, name);
  }

  /**
   * CREATE
   */
  async createAsync(limitRange) {
    try {
      const payload = KubernetesLimitRangeConverter.createPayload(limitRange);
      const namespace = payload.metadata.namespace;
      const params = {};
      const data = await this.KubernetesLimitRanges(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create limit range', err);
    }
  }

  create(limitRange) {
    return this.$async(this.createAsync, limitRange);
  }

  /**
   * DELETE
   */
  async deleteAsync(limitRange) {
    try {
      const params = new KubernetesCommonParams();
      params.id = limitRange.Name;
      const namespace = limitRange.Namespace;
      await this.KubernetesLimitRanges(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete limit range', err);
    }
  }

  delete(limitRange) {
    return this.$async(this.deleteAsync, limitRange);
  }
}

export default KubernetesLimitRangeService;
angular.module('portainer.kubernetes').service('KubernetesLimitRangeService', KubernetesLimitRangeService);
