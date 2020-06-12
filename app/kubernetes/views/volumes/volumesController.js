import _ from 'lodash-es';
import angular from 'angular';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';

class KubernetesVolumesController {
  /* @ngInject */
  constructor($async, $state, Notifications, ModalService, KubernetesVolumeService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.ModalService = ModalService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesApplicationService = KubernetesApplicationService;

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
    this.ModalService.confirmDeletion('Do you want to remove the selected volume(s)?', (confirmed) => {
      if (confirmed) {
        return this.$async(this.removeActionAsync, selectedItems);
      }
    });
  }

  async getVolumesAsync() {
    try {
      const [volumes, applications] = await Promise.all([this.KubernetesVolumeService.get(), this.KubernetesApplicationService.get()]);

      this.volumes = _.map(volumes, (volume) => {
        volume.Applications = KubernetesVolumeHelper.getUsingApplications(volume, applications);
        return volume;
      });
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
    };

    await this.getVolumes();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesVolumesController;
angular.module('portainer.kubernetes').controller('KubernetesVolumesController', KubernetesVolumesController);
