import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesPersistentVolumeClaimService {
  /* @ngInject */
  constructor($async, KubernetesPersistentVolumeClaims) {
    this.$async = $async;
    this.KubernetesPersistentVolumeClaims = KubernetesPersistentVolumeClaims;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  async getAsync(namespace, storageClasses, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([
        this.KubernetesPersistentVolumeClaims(namespace).get(params).$promise,
        this.KubernetesPersistentVolumeClaims(namespace).getYaml(params).$promise,
      ]);

      return KubernetesPersistentVolumeClaimConverter.apiToPersistentVolumeClaim(raw, storageClasses, yaml);
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume claim', err);
    }
  }

  async getAllAsync(namespace, storageClasses) {
    try {
      const data = await this.KubernetesPersistentVolumeClaims(namespace).get().$promise;

      return _.map(data.items, (item) => KubernetesPersistentVolumeClaimConverter.apiToPersistentVolumeClaim(item, storageClasses));
    } catch (err) {
      throw new PortainerError('Unable to retrieve persistent volume claims', err);
    }
  }

  get(namespace, storageClasses, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, storageClasses, name);
    }
    return this.$async(this.getAllAsync, namespace, storageClasses);
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
   * PATCH
   */
  async patchAsync(oldPVC, newPVC) {
    try {
      const params = new KubernetesCommonParams();
      params.id = newPVC.Name;
      const namespace = newPVC.Namespace;
      const payload = KubernetesPersistentVolumeClaimConverter.patchPayload(oldPVC, newPVC);
      if (!payload.length) {
        return;
      }
      const data = await this.KubernetesPersistentVolumeClaims(namespace).patch(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to patch persistent volume claim', err);
    }
  }

  patch(oldPVC, newPVC) {
    return this.$async(this.patchAsync, oldPVC, newPVC);
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
