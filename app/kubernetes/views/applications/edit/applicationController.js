import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesApplicationDataAccessPolicies, KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application/models';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';

class KubernetesApplicationController {
  /* @ngInject */
  constructor(
    $async,
    $state,
    clipboard,
    Notifications,
    LocalStorage,
    ModalService,
    KubernetesApplicationService,
    KubernetesEventService,
    KubernetesStackService,
    KubernetesPodService,
    KubernetesNamespaceHelper
  ) {
    this.$async = $async;
    this.$state = $state;
    this.clipboard = clipboard;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.ModalService = ModalService;

    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesStackService = KubernetesStackService;
    this.KubernetesPodService = KubernetesPodService;

    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;

    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;
    this.KubernetesServiceTypes = KubernetesServiceTypes;

    this.onInit = this.onInit.bind(this);
    this.getApplication = this.getApplication.bind(this);
    this.getApplicationAsync = this.getApplicationAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.updateApplicationAsync = this.updateApplicationAsync.bind(this);
    this.redeployApplicationAsync = this.redeployApplicationAsync.bind(this);
    this.rollbackApplicationAsync = this.rollbackApplicationAsync.bind(this);
    this.copyLoadBalancerIP = this.copyLoadBalancerIP.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('application', index);
  }

  showEditor() {
    this.state.showEditorTab = true;
    this.selectTab(2);
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

  /**
   * ROLLBACK
   */

  async rollbackApplicationAsync() {
    try {
      // await this.KubernetesApplicationService.rollback(this.application, this.formValues.SelectedRevision);
      const revision = _.nth(this.application.Revisions, -2);
      await this.KubernetesApplicationService.rollback(this.application, revision);
      this.Notifications.success('Application successfully rolled back');
      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to rollback the application');
    }
  }

  rollbackApplication() {
    this.ModalService.confirmUpdate('Rolling back the application to a previous configuration may cause a service interruption. Do you wish to continue?', (confirmed) => {
      if (confirmed) {
        return this.$async(this.rollbackApplicationAsync);
      }
    });
  }
  /**
   * REDEPLOY
   */
  async redeployApplicationAsync() {
    try {
      const promises = _.map(this.application.Pods, (item) => this.KubernetesPodService.delete(item));
      await Promise.all(promises);
      this.Notifications.success('Application successfully redeployed');
      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to redeploy the application');
    }
  }

  redeployApplication() {
    this.ModalService.confirmUpdate('Redeploying the application may cause a service interruption. Do you wish to continue?', (confirmed) => {
      if (confirmed) {
        return this.$async(this.redeployApplicationAsync);
      }
    });
  }

  /**
   * UPDATE
   */
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
      this.events = _.filter(
        events,
        (event) =>
          event.Involved.uid === this.application.Id ||
          event.Involved.uid === this.application.ServiceId ||
          _.find(this.application.Pods, (pod) => pod.Id === event.Involved.uid) !== undefined
      );
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
      if (this.application.Note) {
        this.state.expandedNote = true;
      }
      if (this.application.CurrentRevision) {
        this.formValues.SelectedRevision = _.find(this.application.Revisions, { revision: this.application.CurrentRevision.revision });
      }
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
      currentName: this.$state.$current.name,
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
      expandedNote: false,
    };

    this.state.activeTab = this.LocalStorage.getActiveTab('application');

    this.formValues = {
      Note: '',
      SelectedRevision: undefined,
    };

    this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    await this.getApplication();
    await this.getEvents();
    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('application', 0);
    }
  }
}

export default KubernetesApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationController', KubernetesApplicationController);
