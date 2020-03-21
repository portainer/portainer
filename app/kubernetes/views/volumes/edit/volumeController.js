import angular from 'angular';
import _ from 'lodash-es';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';

class KubernetesVolumeController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesVolumeService, KubernetesEventService, KubernetesNamespaceHelper) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;

    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;

    this.onInit = this.onInit.bind(this);
    this.getVolume = this.getVolume.bind(this);
    this.getVolumeAsync = this.getVolumeAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  showEditor() {
    this.state.showEditorTab = true;
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
      this.volume = await this.KubernetesVolumeService.get(this.state.namespace, this.state.name);
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
  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.get(this.state.namespace);
      this.events = _.filter(events, (event) => event.Involved.uid === this.volume.PersistentVolumeClaim.Id);
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
    try {
      this.state = {
        activeTab: 0,
        showEditorTab: false,
        eventsLoading: true,
        namespace: this.$transition$.params().namespace,
        name: this.$transition$.params().name
      };

      await this.getVolume();
      await this.getEvents();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesVolumeController;
angular.module('portainer.kubernetes').controller('KubernetesVolumeController', KubernetesVolumeController);
