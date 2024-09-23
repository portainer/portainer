import angular from 'angular';

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

  async onInit() {
    this.state = {
      viewReady: false,
      currentName: this.$state.$current.name,
      activeTab: this.LocalStorage.getActiveTab('volumes'),
      isAdmin: this.Authentication.isAdmin(),
    };

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
