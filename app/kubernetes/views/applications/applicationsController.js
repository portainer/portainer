import angular from 'angular';
import * as _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesStackHelper from 'Kubernetes/helpers/stackHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';

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

class KubernetesApplicationsController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesApplicationService, KubernetesStorageService, KubernetesVolumeService, Authentication, ModalService, LocalStorage) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesStorageService = KubernetesStorageService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.Authentication = Authentication;
    this.ModalService = ModalService;
    this.LocalStorage = LocalStorage;

    this.onInit = this.onInit.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.removeStacksAction = this.removeStacksAction.bind(this);
    this.removeStacksActionAsync = this.removeStacksActionAsync.bind(this);
    this.onPublishingModeClick = this.onPublishingModeClick.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('applications', index);
  }

  async removeStacksActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const stack of selectedItems) {
      try {
        const promises = _.map(stack.Applications, (app) => this.KubernetesApplicationService.delete(app));
        await Promise.all(promises);
        this.Notifications.success('Stack successfully removed', stack.Name);
        _.remove(this.stacks, { Name: stack.Name });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove stack');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }

  removeStacksAction(selectedItems) {
    this.ModalService.confirmDeletion(
      'Are you sure that you want to remove the selected stack(s) ? This will remove all the applications associated to the stack(s).',
      (confirmed) => {
        if (confirmed) {
          return this.$async(this.removeStacksActionAsync, selectedItems);
        }
      }
    );
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const application of selectedItems) {
      try {
        await this.KubernetesApplicationService.delete(application);
        this.Notifications.success('Application successfully removed', application.Name);
        const index = this.applications.indexOf(application);
        this.applications.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove application');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }

  removeAction(selectedItems) {
    return this.$async(this.removeActionAsync, selectedItems);
  }

  onPublishingModeClick(application) {
    this.state.activeTab = 1;
    _.forEach(this.ports, (item) => {
      item.Expanded = false;
      item.Highlighted = false;
      if (item.Name === application.Name) {
        item.Expanded = true;
        item.Highlighted = true;
      }
    });
  }

  async getApplicationsAsync() {
    try {
      const [applications, storages, volumes] = await Promise.all([
        this.KubernetesApplicationService.get(),
        this.KubernetesStorageService.get(this.state.endpointId),
        this.KubernetesVolumeService.get(),
      ]);
      this.applications = applications;
      this.stacks = KubernetesStackHelper.stacksFromApplications(applications);
      this.ports = KubernetesApplicationHelper.portMappingsFromApplications(applications);
      this.storages = buildStorages(storages, volumes);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.state = {
      endpointId: this.$transition$.params().endpointId,
      activeTab: 0,
      currentName: this.$state.$current.name,
      isAdmin: this.Authentication.isAdmin(),
      viewReady: false,
    };

    this.state.activeTab = this.LocalStorage.getActiveTab('applications');

    await this.getApplications();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('applications', 0);
    }
  }
}

export default KubernetesApplicationsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController', KubernetesApplicationsController);
