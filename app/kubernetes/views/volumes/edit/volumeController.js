import angular from 'angular';
import _ from 'lodash-es';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';

class KubernetesVolumeController {
  /* @ngInject */
  constructor($async, $state, Notifications, LocalStorage, KubernetesVolumeService, KubernetesEventService, KubernetesNamespaceHelper, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;

    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getVolume = this.getVolume.bind(this);
    this.getVolumeAsync = this.getVolumeAsync.bind(this);
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

  /**
   * VOLUME
   */
  async getVolumeAsync() {
    try {
      const [volume, applications] = await Promise.all([
        this.KubernetesVolumeService.get(this.state.namespace, this.state.name),
        this.KubernetesApplicationService.get(this.state.namespace)
      ]);
      volume.Applications = KubernetesVolumeHelper.getUsingApplications(volume, applications);
      this.volume = volume;
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
      eventWarningCount: 0
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
