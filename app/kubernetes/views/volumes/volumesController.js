import * as _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import angular from 'angular';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';

function buildStorages(storages, volumes) {
  _.forEach(storages, (s) => {
    const filteredVolumes = _.filter(volumes, ['PersistentVolumeClaim.StorageClass.Name', s.Name, 'PersistentVolumeClaim.StorageClass.Provisioner', s.Provisioner]);
    s.Volumes = filteredVolumes;
    s.Size = computeSize(filteredVolumes);
  });
  return storages;
}

function computeSize(volumes) {
  let hasT,
    hasG,
    hasM = false;
  const size = _.sumBy(volumes, (v) => {
    const storage = v.PersistentVolumeClaim.Storage;
    if (!hasT && _.endsWith(storage, 'TB')) {
      hasT = true;
    } else if (!hasG && _.endsWith(storage, 'GB')) {
      hasG = true;
    } else if (!hasM && _.endsWith(storage, 'MB')) {
      hasM = true;
    }
    return filesizeParser(storage, { base: 10 });
  });
  if (hasT) {
    return size / 1000 / 1000 / 1000 / 1000 + 'TB';
  } else if (hasG) {
    return size / 1000 / 1000 / 1000 + 'GB';
  } else if (hasM) {
    return size / 1000 / 1000 + 'MB';
  }
  return size;
}

class KubernetesVolumesController {
  /* @ngInject */
  constructor($async, $state, Notifications, ModalService, LocalStorage, EndpointProvider, KubernetesStorageService, KubernetesVolumeService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.ModalService = ModalService;
    this.LocalStorage = LocalStorage;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesStorageService = KubernetesStorageService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getVolumes = this.getVolumes.bind(this);
    this.getVolumesAsync = this.getVolumesAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('volumes', index);
  }

  async removeActionAsync(selectedItems) {
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
          this.$state.reload();
        }
      }
    }
  }

  removeAction(selectedItems) {
    this.ModalService.confirmDeletion('Do you want to remove the selected volume(s)?', (confirmed) => {
      if (confirmed) {
        return this.$async(this.removeActionAsync, selectedItems);
      }
    });
  }

  async getVolumesAsync() {
    try {
      const [volumes, applications, storages] = await Promise.all([
        this.KubernetesVolumeService.get(),
        this.KubernetesApplicationService.get(),
        this.KubernetesStorageService.get(this.state.endpointId),
      ]);

      this.volumes = _.map(volumes, (volume) => {
        volume.Applications = KubernetesVolumeHelper.getUsingApplications(volume, applications);
        return volume;
      });
      this.storages = buildStorages(storages, volumes);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retreive resource pools');
    }
  }

  getVolumes() {
    return this.$async(this.getVolumesAsync);
  }

  async onInit() {
    this.state = {
      viewReady: false,
      // endpointId: this.$transition$.params().endpointId, // TODO: use this when moving to endpointID in URL
      endpointId: this.EndpointProvider.endpointID(),
      activeTab: this.LocalStorage.getActiveTab('volumes'),
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
