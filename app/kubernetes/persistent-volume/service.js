import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesPersistentVolumeConverter from 'Kubernetes/persistent-volume/converter';

class KubernetesPersistentVolumeService {
  /* @ngInject */
  constructor($async, KubernetesPersistentVolume, EndpointProvider) {
    this.$async = $async;
    this.KubernetesPersistentVolume = KubernetesPersistentVolume;
    this.EndpointProvider = EndpointProvider;

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
      const data = await this.KubernetesPersistentVolume().get(params).$promise;
      const storageClasses = this.EndpointProvider.currentEndpoint().Kubernetes.Configuration.StorageClasses;
      return KubernetesPersistentVolumeConverter.apiToPersistentVolume(data, storageClasses);
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume', err);
    }
  }

  async getAllAsync() {
    try {
      const data = await this.KubernetesPersistentVolume().get().$promise;
      const storageClasses = this.EndpointProvider.currentEndpoint().Kubernetes.Configuration.StorageClasses;
      const res = _.map(data.items, (item) => KubernetesPersistentVolumeConverter.apiToPersistentVolume(item, storageClasses));
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volumes', err);
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

  async createAsync(pv) {
    try {
      const payload = KubernetesPersistentVolumeConverter.createPayload(pv);
      const data = await this.KubernetesPersistentVolume().create(payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create persistent volume', err);
    }
  }

  create(pv) {
    return this.$async(this.createAsync, pv);
  }

  /**
   * DELETE
   */
  async deleteAsync(pv) {
    try {
      const params = new KubernetesCommonParams();
      params.id = pv.Name;
      await this.KubernetesPersistentVolume().delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete persistent volume', err);
    }
  }

  delete(pv) {
    return this.$async(this.deleteAsync, pv);
  }
}

export default KubernetesPersistentVolumeService;
angular.module('portainer.kubernetes').service('KubernetesPersistentVolumeService', KubernetesPersistentVolumeService);
