import angular from 'angular';

class KubernetesVolumesController {
  /* @ngInject */
  constructor($async, $state, Notifications, ModalService, KubernetesVolumeService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.ModalService = ModalService;
    this.KubernetesVolumeService = KubernetesVolumeService;

    this.onInit = this.onInit.bind(this);
    this.getVolumes = this.getVolumes.bind(this);
    this.getVolumesAsync = this.getVolumesAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
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
    this.ModalService.confirmDeletion(
      'Do you want to remove the selected volume(s)?',
      (confirmed) => {
        if (confirmed) {
          return this.$async(this.removeActionAsync, selectedItems);
        }
      });
  }

  async getVolumesAsync() {
    try {
      this.volumes = await this.KubernetesVolumeService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retreive resource pools');
    }
  }

  getVolumes() {
    return this.$async(this.getVolumesAsync)
  }

  async onInit() {
    await this.getVolumes();
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesVolumesController;
angular.module('portainer.kubernetes').controller('KubernetesVolumesController', KubernetesVolumesController);
