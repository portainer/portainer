import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import angular from 'angular';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';

function buildStorages(storages, volumes) {
  _.forEach(storages, (s) => {
    const filteredVolumes = _.filter(volumes, ['PersistentVolumeClaim.storageClass.Name', s.Name, 'PersistentVolumeClaim.storageClass.Provisioner', s.Provisioner]);
    s.Volumes = filteredVolumes;
    s.size = computeSize(filteredVolumes);
  });
  return storages;
}

function computeSize(volumes) {
  const size = _.sumBy(volumes, (v) => filesizeParser(v.PersistentVolumeClaim.Storage, { base: 10 }));
  const format = KubernetesResourceQuotaHelper.formatBytes(size);
  return `${format.size}${format.sizeUnit}`;
}

class KubernetesVolumesController {
  /* @ngInject */
  constructor($async, $state, Notifications, Authentication, LocalStorage, KubernetesStorageService, KubernetesVolumeService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.LocalStorage = LocalStorage;
    this.KubernetesStorageService = KubernetesStorageService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getVolumes = this.getVolumes.bind(this);
    this.getVolumesAsync = this.getVolumesAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('volumes', index);
  }

  async removeAction(selectedItems) {
    return this.$async(async () => {
      let actionCount = selectedItems.length;
      for (const volume of selectedItems) {
        try {
          await this.KubernetesVolumeService.delete(volume);
          this.Notifications.success('Volume successfully removed', volume.PersistentVolumeClaim.Name);
          const index = this.volumes.indexOf(volume);
          this.volumes.splice(index, 1);
        } catch (err) {
          this.Notifications.error('Failure', err, 'Unable to remove volume');
        } finally {
          --actionCount;
          if (actionCount === 0) {
            this.$state.reload(this.$state.current);
          }
        }
      }
    });
  }

  async getVolumesAsync() {
    const storageClasses = this.endpoint.Kubernetes.Configuration.StorageClasses;
    try {
      const [volumes, applications, storages] = await Promise.all([
        this.KubernetesVolumeService.get(undefined, storageClasses),
        this.KubernetesApplicationService.get(),
        this.KubernetesStorageService.get(this.endpoint.Id),
      ]);

      this.volumes = _.map(volumes, (volume) => {
        volume.Applications = KubernetesVolumeHelper.getUsingApplications(volume, applications);
        return volume;
      });
      this.storages = buildStorages(storages, volumes);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retreive namespaces');
    }
  }

  getVolumes() {
    return this.$async(this.getVolumesAsync);
  }

  async onInit() {
    this.state = {
      viewReady: false,
      currentName: this.$state.$current.name,
      activeTab: this.LocalStorage.getActiveTab('volumes'),
      isAdmin: this.Authentication.isAdmin(),
    };

    await this.getVolumes();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('volumes', 0);
    }
  }
}

export default KubernetesVolumesController;
angular.module('portainer.kubernetes').controller('KubernetesVolumesController', KubernetesVolumesController);
