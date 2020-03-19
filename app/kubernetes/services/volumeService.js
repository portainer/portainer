import angular from 'angular';
import _ from 'lodash-es';

import KubernetesVolumeConverter from 'Kubernetes/converters/volume';

class KubernetesVolumeService {
  /* @ngInject */
  constructor($async, KubernetesResourcePoolService, KubernetesApplicationService, KubernetesPersistentVolumeClaimService) {
    this.$async = $async;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const ns = await this.KubernetesResourcePoolService.get(namespace);
      const pools = [ns];
      const [data, applications] = Promise.all([
        this.KubernetesPersistentVolumeClaimService.get(namespace, name),
        this.KubernetesApplicationService.get(namespace)
      ]);
      return KubernetesVolumeConverter.pvcToVolume(data, pools, applications);
    } catch (err) {
      throw err;
    }
  }

  async getAllAsync(namespace) {
    try {
      let pools;
      if (namespace) {
        const ns = await this.KubernetesResourcePoolService.get(namespace);
        pools = [ns];
      } else {
        pools = await this.KubernetesResourcePoolService.get();
      }
      const pvcPromises = _.map(pools, (item) => this.KubernetesPersistentVolumeClaimService.get(item.Namespace.Name));
      const appPromises = _.map(pools, (item) => this.KubernetesApplicationService.get(item.Namespace.Name));
      const [pvcData, appData] = await Promise.all([
        Promise.all(pvcPromises), Promise.all(appPromises)
      ]);
      const applications = _.flatten(appData);
      const pvc = _.flatten(pvcData);
      const res = _.map(pvc, (item) => KubernetesVolumeConverter.pvcToVolume(item, pools, applications));
      return res;
    } catch (err) {
      throw err;
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    return this.$async(this.getAllAsync, namespace);
  }

  /**
   * DELETE
   */
  async deleteAsync(volume) {
    try {
      await this.KubernetesPersistentVolumeClaimService.delete(volume.PersistentVolumeClaim);
    } catch (err) {
      throw err;
    }
  }

  delete(volume) {
    return this.$async(this.deleteAsync, volume);
  }
}

export default KubernetesVolumeService;
angular.module('portainer.kubernetes').service('KubernetesVolumeService', KubernetesVolumeService);
