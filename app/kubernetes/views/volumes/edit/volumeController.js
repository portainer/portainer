import angular from 'angular';
import _ from 'lodash-es';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';
import filesizeParser from 'filesize-parser';

class KubernetesVolumeController {
  /* @ngInject */
  constructor(
    $async,
    $state,
    Notifications,
    LocalStorage,
    KubernetesVolumeService,
    KubernetesEventService,
    KubernetesNamespaceHelper,
    KubernetesApplicationService,
    KubernetesPersistentVolumeClaimService,
    KubernetesResourcePoolService,
    ModalService,
    KubernetesPodService
  ) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;

    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.ModalService = ModalService;
    this.KubernetesPodService = KubernetesPodService;

    this.onInit = this.onInit.bind(this);
    this.getVolume = this.getVolume.bind(this);
    this.getVolumeAsync = this.getVolumeAsync.bind(this);
    this.updateVolumeAsync = this.updateVolumeAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('volume', index);
  }

  showEditor() {
    this.state.showEditorTab = true;
    this.selectTab(2);
  }

  isExternalVolume() {
    return KubernetesVolumeHelper.isExternalVolume(this.volume);
  }

  isSystemNamespace() {
    return this.KubernetesNamespaceHelper.isSystemNamespace(this.volume.ResourcePool.Namespace.Name);
  }

  isUsed() {
    return KubernetesVolumeHelper.isUsed(this.volume);
  }

  onChangeSize() {
    if (this.state.volumeSize) {
      const size = filesizeParser(this.state.volumeSize + this.state.volumeSizeUnit, { base: 10 });
      if (this.state.oldVolumeSize > size) {
        this.state.errors.volumeSize = true;
        this.state.errors.quotaExceeded = false;
      } else if (this.state.quota.hasQuota && size - this.state.oldVolumeSize > this.state.quota.availableSize) {
        this.state.errors.volumeSize = false;
        this.state.errors.quotaExceeded = true;
      } else {
        this.state.errors.volumeSize = false;
        this.state.errors.quotaExceeded = false;
      }
    } else {
      this.state.errors.volumeSize = false;
      this.state.errors.quotaExceeded = false;
    }
  }

  sizeIsValid() {
    return (
      !this.state.errors.quotaExceeded &&
      !this.state.errors.volumeSize &&
      this.state.volumeSize &&
      this.state.oldVolumeSize !== filesizeParser(this.state.volumeSize + this.state.volumeSizeUnit, { base: 10 })
    );
  }

  /**
   * VOLUME
   */

  async updateVolumeAsync(redeploy) {
    try {
      this.volume.PersistentVolumeClaim.Storage = this.state.volumeSize + this.state.volumeSizeUnit.charAt(0);
      await this.KubernetesPersistentVolumeClaimService.patch(this.oldVolume.PersistentVolumeClaim, this.volume.PersistentVolumeClaim);
      this.Notifications.success('Volume successfully updated');

      if (redeploy) {
        const promises = _.flatten(
          _.map(this.volume.Applications, (app) => {
            return _.map(app.Pods, (item) => this.KubernetesPodService.delete(item));
          })
        );
        await Promise.all(promises);
        this.Notifications.success('Applications successfully redeployed');
      }

      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update volume.');
    }
  }

  updateVolume() {
    if (KubernetesVolumeHelper.isUsed(this.volume)) {
      this.ModalService.confirmRedeploy(
        'One or multiple applications are currently using this volume.</br> For the change to be taken into account these applications will need to be redeployed. Do you want us to reschedule it now?',
        (redeploy) => {
          return this.$async(this.updateVolumeAsync, redeploy);
        }
      );
    } else {
      return this.$async(this.updateVolumeAsync, false);
    }
  }

  async getVolumeAsync() {
    try {
      const [volume, applications, resourcePool, volumes] = await Promise.all([
        this.KubernetesVolumeService.get(this.state.namespace, this.state.name),
        this.KubernetesApplicationService.get(this.state.namespace),
        this.KubernetesResourcePoolService.get(this.state.namespace),
        this.KubernetesVolumeService.get(this.state.namespace),
      ]);
      volume.Applications = KubernetesVolumeHelper.getUsingApplications(volume, applications);

      const quota = resourcePool.Quota;
      this.state.quota = {
        availableSize: 0,
        hasQuota: false,
        maxSize: 0,
      };
      if (quota && volume.PersistentVolumeClaim.StorageClass) {
        const storageRequest = _.find(quota.StorageRequests, { Name: volume.PersistentVolumeClaim.StorageClass.Name });
        if (storageRequest) {
          this.state.quota.hasQuota = true;
          const sameStorageVolumes = _.filter(volumes, ['PersistentVolumeClaim.StorageClass.Name', volume.PersistentVolumeClaim.StorageClass.Name]);
          const used = _.reduce(sameStorageVolumes, (sum, v) => sum + filesizeParser(v.PersistentVolumeClaim.Storage, { base: 10 }), 0);
          const quotaLimitSize = filesizeParser(`${storageRequest.Size}${storageRequest.SizeUnit}`, { base: 10 });
          this.state.quota.availableSize = quotaLimitSize - used;
        }
      }

      this.volume = volume;
      this.oldVolume = angular.copy(volume);
      this.state.volumeSize = parseInt(volume.PersistentVolumeClaim.Storage.slice(0, -2), 10);
      this.state.volumeSizeUnit = volume.PersistentVolumeClaim.Storage.slice(-2);
      this.state.oldVolumeSize = filesizeParser(volume.PersistentVolumeClaim.Storage, { base: 10 });
      this.state.quota.maxSize = this.state.quota.availableSize + this.state.oldVolumeSize;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve volume');
    }
  }

  getVolume() {
    return this.$async(this.getVolumeAsync);
  }

  /**
   * EVENTS
   */
  hasEventWarnings() {
    return this.state.eventWarningCount;
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.get(this.state.namespace);
      this.events = _.filter(events, (event) => event.Involved.uid === this.volume.PersistentVolumeClaim.Id);
      this.state.eventWarningCount = KubernetesEventHelper.warningCount(this.events);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application related events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  /**
   * ON INIT
   */
  async onInit() {
    this.state = {
      activeTab: 0,
      currentName: this.$state.$current.name,
      showEditorTab: false,
      eventsLoading: true,
      viewReady: false,
      namespace: this.$transition$.params().namespace,
      name: this.$transition$.params().name,
      eventWarningCount: 0,
      availableSizeUnits: ['MB', 'GB', 'TB'],
      increaseSize: false,
      volumeSize: 0,
      volumeSizeUnit: 'GB',
      errors: {
        volumeSize: false,
        quotaExceeded: false,
      },
    };

    this.state.activeTab = this.LocalStorage.getActiveTab('volume');

    try {
      await this.getVolume();
      await this.getEvents();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('volume', 0);
    }
  }
}

export default KubernetesVolumeController;
angular.module('portainer.kubernetes').controller('KubernetesVolumeController', KubernetesVolumeController);
