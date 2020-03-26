import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';

class KubernetesApplicationController {
  /* @ngInject */
  constructor($async, $state, clipboard, Notifications, KubernetesApplicationService, KubernetesEventService,
    KubernetesVolumeService, KubernetesConfigurationService) {
    this.$async = $async;
    this.$state = $state;
    this.clipboard = clipboard;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesConfigurationService = KubernetesConfigurationService;

    this.onInit = this.onInit.bind(this);
    this.getApplication = this.getApplication.bind(this);
    this.getApplicationAsync = this.getApplicationAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getVolumes = this.getVolumes.bind(this);
    this.getVolumesAsync = this.getVolumesAsync.bind(this);
    this.getConfigurations = this.getConfigurations.bind(this);
    this.getConfigurationsAsync = this.getConfigurationsAsync.bind(this);
    this.copyLoadBalancerIP = this.copyLoadBalancerIP.bind(this);
  }

  showEditor() {
    this.state.showEditorTab = true;
  }

  copyLoadBalancerIP() {
    this.clipboard.copyText(this.application.LoadBalancerIPAddress);
    $('#copyNotificationLB').show().fadeOut(2500);
  }

  /**
   * VOLUMES
   */

  async getVolumesAsync() {
    try {
      const volumes = await this.KubernetesVolumeService.get(this.state.params.namespace);
      this.volumes = KubernetesApplicationHelper.getUsedVolumes(this.application, volumes);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application related volumes');
    }
  }

  getVolumes() {
    return this.$async(this.getVolumesAsync);
  }
  /**
   * CONFIGURATIONS
   */
  async getConfigurationsAsync() {
    try {
      const configurations = await this.KubernetesConfigurationService.get(this.state.params.namespace);
      this.configurations = KubernetesApplicationHelper.getUsedConfigurations(this.application, configurations);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application related configurations');
    }
  }

  getConfigurations() {
    return this.$async(this.getConfigurationsAsync);
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
      const events = await this.KubernetesEventService.get(this.state.params.namespace);
      this.events = _.filter(events, (event) => event.Involved.uid === this.application.Id
        || event.Involved.uid === this.application.ServiceId
        || _.find(this.application.Pods, (pod) => pod.Id === event.Involved.uid) !== undefined);
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
   * APPLICATION
   */
  async getApplicationAsync() {
    try {
      this.state.dataLoading = true;
      this.application = await this.KubernetesApplicationService.get(this.state.params.namespace, this.state.params.name);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application details');
    } finally {
      this.state.dataLoading = false;
    }
  }

  getApplication() {
    return this.$async(this.getApplicationAsync);
  }

  async onInit() {
    this.state = {
      activeTab: 0,
      showEditorTab: false,
      DisplayedPanel: 'pods',
      eventsLoading: true,
      dataLoading: true,
      viewReady: false,
      params: {
        namespace: this.$transition$.params().namespace,
        name: this.$transition$.params().name,
      },
      eventWarningCount: 0
    };

    this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    await this.getApplication();
    await Promise.all([
      this.getEvents(),
      this.getVolumes(),
      this.getConfigurations()
    ]);

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationController', KubernetesApplicationController);
