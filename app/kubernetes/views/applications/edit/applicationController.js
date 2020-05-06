import angular from 'angular';
import _ from 'lodash-es';
import {
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationDeploymentTypes
} from 'Kubernetes/models/application/models';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

class KubernetesApplicationController {
  /* @ngInject */
  constructor($async, $state, clipboard, Notifications, KubernetesApplicationService, KubernetesEventService, KubernetesStackService, KubernetesNamespaceHelper) {
    this.$async = $async;
    this.$state = $state;
    this.clipboard = clipboard;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesStackService = KubernetesStackService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;

    this.onInit = this.onInit.bind(this);
    this.getApplication = this.getApplication.bind(this);
    this.getApplicationAsync = this.getApplicationAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.updateApplicationAsync = this.updateApplicationAsync.bind(this);
    this.copyLoadBalancerIP = this.copyLoadBalancerIP.bind(this);
  }

  showEditor() {
    this.state.showEditorTab = true;
  }

  isSystemNamespace() {
    return this.KubernetesNamespaceHelper.isSystemNamespace(this.application.ResourcePool);
  }

  isExternalApplication() {
    return KubernetesApplicationHelper.isExternalApplication(this.application);
  }

  copyLoadBalancerIP() {
    this.clipboard.copyText(this.application.LoadBalancerIPAddress);
    $('#copyNotificationLB').show().fadeOut(2500);
  }

  copyApplicationName() {
    this.clipboard.copyText(this.application.Name);
    $('#copyNotificationApplicationName').show().fadeOut(2500);
  }

  hasPersistedFolders() {
    return this.application && this.application.PersistedFolders.length;
  }

  hasVolumeConfiguration() {
    return this.application && this.application.ConfigurationVolumes.length;
  }

  hasEventWarnings() {
    return this.state.eventWarningCount;
  }

  async updateApplicationAsync() {
    try {
      const application = angular.copy(this.application);
      application.Note = this.formValues.Note;
      await this.KubernetesApplicationService.patch(this.application, application, true);
      this.Notifications.success('Application successfully updated');
      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update application');
    }
  }

  updateApplication() {
    return this.$async(this.updateApplicationAsync);
  }

  /**
   * EVENTS
   */
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
      this.formValues.Note = this.application.Note;
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
      eventWarningCount: 0,
    };

    this.formValues = {
      Note: '',
    };

    this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    await this.getApplication();
    await this.getEvents();
    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationController', KubernetesApplicationController);
