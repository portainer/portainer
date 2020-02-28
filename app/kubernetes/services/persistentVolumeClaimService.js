
import angular from 'angular';
import PortainerError from 'Portainer/error';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesPersistentVolumeClaimService {
  /* @ngInject */
  constructor($async, KubernetesPersistentVolumeClaims) {
    this.$async = $async;
    this.KubernetesPersistentVolumeClaims = KubernetesPersistentVolumeClaims;

    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
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
  async deleteAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      await this.KubernetesPersistentVolumeClaims(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete persistent volume claim', err);
    }
  }

  delete(namespace, name) {
    return this.$async(this.deleteAsync, namespace, name);
  }
}

export default KubernetesPersistentVolumeClaimService;
angular.module('portainer.kubernetes').service('KubernetesPersistentVolumeClaimService', KubernetesPersistentVolumeClaimService);
