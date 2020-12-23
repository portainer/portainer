import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesPVConverter from 'Kubernetes/pv/converter';

class KubernetesPVService {
  /* @ngInject */
  constructor($async, KubernetesPV) {
    this.$async = $async;
    this.KubernetesPV = KubernetesPV;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const data = await this.KubernetesPV(namespace).get(params).$promise;
      return KubernetesPVConverter.apiToPV(data);
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      // convert from apiPayload to KubernetesPV
      const data = await this.KubernetesPV(namespace).get().$promise;
      return _.map(data.items, (item) => KubernetesPVConverter.apiToPV(item));
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume', err);
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
      const pv = KubernetesPVConverter.formValuesToPV(formValues);
      // convert from KubernetesPV to apiPayload
      const payload = KubernetesPVConverter.createPayload(pv);
      const data = await this.KubernetesPV().create(payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create persistent volume', err);
    }
  }

  create(pv) {
    return this.$async(this.createAsync, pv);
  }
}

export default KubernetesPVService;
angular.module('portainer.kubernetes').service('KubernetesPVService', KubernetesPVService);
