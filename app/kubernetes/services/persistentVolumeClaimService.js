import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesPersistentVolumeClaimService {
  /* @ngInject */
  constructor($async, EndpointProvider, KubernetesPersistentVolumeClaims) {
    this.$async = $async;
    const endpoint = EndpointProvider.currentEndpoint();
    this.storageClasses = endpoint.Kubernetes.Configuration.StorageClasses;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesPersistentVolumeClaims = KubernetesPersistentVolumeClaims;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const data = this.KubernetesPersistentVolumeClaims(namespace).get(params).$promise;
      return KubernetesPersistentVolumeClaimConverter.apiToPersistentVolumeClaim(data, this.storageClasses);
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume claim', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesPersistentVolumeClaims(namespace).get().$promise;
      return _.map(data.items, (item) => KubernetesPersistentVolumeClaimConverter.apiToPersistentVolumeClaim(item, this.storageClasses));
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume claims', err);
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
  async createAsync(claim) {
    try {
      const params = {};
      const payload = KubernetesPersistentVolumeClaimConverter.createPayload(claim);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesPersistentVolumeClaims(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create persistent volume claim', err);
    }
  }

  create(claim) {
    return this.$async(this.createAsync, claim);
  }

  /**
   * DELETE
   */
  async deleteAsync(pvc) {
    try {
      const params = new KubernetesCommonParams();
      params.id = pvc.Name;
      const namespace = pvc.Namespace;
      await this.KubernetesPersistentVolumeClaims(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete persistent volume claim', err);
    }
  }

  delete(pvc) {
    return this.$async(this.deleteAsync, pvc);
  }
}

export default KubernetesPersistentVolumeClaimService;
angular.module('portainer.kubernetes').service('KubernetesPersistentVolumeClaimService', KubernetesPersistentVolumeClaimService);
