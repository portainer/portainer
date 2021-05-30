import angular from 'angular';
import _ from 'lodash-es';

import KubernetesVolumeConverter from 'Kubernetes/converters/volume';
import KubernetesPersistentVolumeConverter from 'Kubernetes/persistent-volume/converter';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';

class KubernetesVolumeService {
  /* @ngInject */
  constructor($async, KubernetesResourcePoolService, KubernetesApplicationService, KubernetesPersistentVolumeClaimService, KubernetesPersistentVolumeService) {
    this.$async = $async;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;
    this.KubernetesPersistentVolumeService = KubernetesPersistentVolumeService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const [pvc, pool] = await Promise.all([this.KubernetesPersistentVolumeClaimService.get(namespace, name), this.KubernetesResourcePoolService.get(namespace)]);
      let pv = undefined;
      if (pvc.PersistentVolumeName) {
        pv = await this.KubernetesPersistentVolumeService.get(pvc.PersistentVolumeName);
      }
      return KubernetesVolumeConverter.apiToVolume(pvc, pv, pool);
    } catch (err) {
      throw err;
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesResourcePoolService.get(namespace);
      const pools = data instanceof Array ? data : [data];
      const res = await Promise.all(
        _.map(pools, async (pool) => {
          const pvcs = await this.KubernetesPersistentVolumeClaimService.get(pool.Namespace.Name);
          const pvs = [];
          await Promise.all(
            _.map(pvcs, async (pvc) => {
              if (pvc.PersistentVolumeName) {
                pvs.push(await this.KubernetesPersistentVolumeService.get(pvc.PersistentVolumeName));
              }
            })
          );
          return _.map(pvcs, (pvc) => {
            const pv = pvc.PersistentVolumeName ? _.find(pvs, { Name: pvc.PersistentVolumeName }) : undefined;
            return KubernetesVolumeConverter.apiToVolume(pvc, pv, pool);
          });
        })
      );
      return _.flatten(res);
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
   * CREATE all KubernetesVolume composite elements (but the ResourcePool)
   * @param {KubernetesVolumeFormValues} fv
   */
  create(fv) {
    return this.$async(async () => {
      try {
        fv.ApplicationOwner = KubernetesCommonHelper.ownerToLabel(fv.ApplicationOwner);
        const pv = KubernetesPersistentVolumeConverter.formValuesToPersistentVolume(fv);
        const data = await this.KubernetesPersistentVolumeService.create(pv);
        const pvc = KubernetesPersistentVolumeClaimConverter.volumeFormValuesToVolumeClaim(fv);
        pvc.PersistentVolumeName = data.metadata.name;
        await this.KubernetesPersistentVolumeClaimService.create(pvc);
      } catch (err) {
        throw err;
      }
    });
  }

  /**
   * DELETE
   */
  async deleteAsync(volume) {
    try {
      await this.KubernetesPersistentVolumeClaimService.delete(volume.PersistentVolumeClaim);
      if (volume.PersistentVolume) {
        await this.KubernetesPersistentVolumeService.delete(volume.PersistentVolume);
      }
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
