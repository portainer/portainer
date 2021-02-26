import angular from 'angular';
import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';
import { KubernetesApplicationDataAccessPolicies, KubernetesApplicationDeploymentTypes, KubernetesApplicationTypes } from 'Kubernetes/models/application/models';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from 'Kubernetes/pod/models';
import { KubernetesPodContainerTypes } from 'Kubernetes/pod/models/index';

function computeTolerations(nodes, application) {
  const pod = application.Pods[0];
  _.forEach(nodes, (n) => {
    n.AcceptsApplication = true;
    n.Expanded = false;
    if (!pod) {
      return;
    }
    n.UnmetTaints = [];
    _.forEach(n.Taints, (t) => {
      const matchKeyMatchValueMatchEffect = _.find(pod.Tolerations, { Key: t.Key, Operator: 'Equal', Value: t.Value, Effect: t.Effect });
      const matchKeyAnyValueMatchEffect = _.find(pod.Tolerations, { Key: t.Key, Operator: 'Exists', Effect: t.Effect });
      const matchKeyMatchValueAnyEffect = _.find(pod.Tolerations, { Key: t.Key, Operator: 'Equal', Value: t.Value, Effect: '' });
      const matchKeyAnyValueAnyEffect = _.find(pod.Tolerations, { Key: t.Key, Operator: 'Exists', Effect: '' });
      const anyKeyAnyValueAnyEffect = _.find(pod.Tolerations, { Key: '', Operator: 'Exists', Effect: '' });

      if (!matchKeyMatchValueMatchEffect && !matchKeyAnyValueMatchEffect && !matchKeyMatchValueAnyEffect && !matchKeyAnyValueAnyEffect && !anyKeyAnyValueAnyEffect) {
        n.AcceptsApplication = false;
        n.UnmetTaints.push(t);
      } else {
        n.AcceptsApplication = true;
      }
    });
  });
  return nodes;
}

// For node requirement format depending on operator value
// see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#nodeselectorrequirement-v1-core
// Some operators require empty "values" field, some only one element in "values" field, etc

function computeAffinities(nodes, application) {
  if (!application.Pods || application.Pods.length === 0) {
    return nodes;
  }

  const pod = application.Pods[0];
  _.forEach(nodes, (n) => {
    if (pod.NodeSelector) {
      const patch = JsonPatch.compare(n.Labels, pod.NodeSelector);
      _.remove(patch, { op: 'remove' });
      n.UnmatchedNodeSelectorLabels = _.map(patch, (i) => {
        return { key: _.trimStart(i.path, '/'), value: i.value };
      });
      if (n.UnmatchedNodeSelectorLabels.length) {
        n.AcceptsApplication = false;
      }
    }

    if (pod.Affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
      const unmatchedTerms = _.map(pod.Affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms, (t) => {
        const unmatchedExpressions = _.map(t.matchExpressions, (e) => {
          const exists = {}.hasOwnProperty.call(n.Labels, e.key);
          const isIn = exists && _.includes(e.values, n.Labels[e.key]);
          if (
            (e.operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.EXISTS && exists) ||
            (e.operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.DOES_NOT_EXIST && !exists) ||
            (e.operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.IN && isIn) ||
            (e.operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.NOT_IN && !isIn) ||
            (e.operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.GREATER_THAN && exists && parseInt(n.Labels[e.key], 10) > parseInt(e.values[0], 10)) ||
            (e.operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.LOWER_THAN && exists && parseInt(n.Labels[e.key], 10) < parseInt(e.values[0], 10))
          ) {
            return;
          }
          return e;
        });
        return _.without(unmatchedExpressions, undefined);
      });
      _.remove(unmatchedTerms, (i) => i.length === 0);
      n.UnmatchedNodeAffinities = unmatchedTerms;
      if (n.UnmatchedNodeAffinities.length) {
        n.AcceptsApplication = false;
      }
    }
  });
  return nodes;
}

function computePlacements(nodes, application) {
  nodes = computeTolerations(nodes, application);
  nodes = computeAffinities(nodes, application);
  return nodes;
}

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
    KubernetesNodeService,
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
    this.KubernetesNodeService = KubernetesNodeService;

    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;

    this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.KubernetesApplicationTypes = KubernetesApplicationTypes;
    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;
    this.KubernetesServiceTypes = KubernetesServiceTypes;
    this.KubernetesPodContainerTypes = KubernetesPodContainerTypes;

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
    this.selectTab(3);
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

  buildIngressRuleURL(rule) {
    const hostname = rule.Host ? rule.Host : rule.IP;
    return 'http://' + hostname + rule.Path;
  }

  portHasIngressRules(port) {
    return port.IngressRules.length > 0;
  }

  ruleCanBeDisplayed(rule) {
    return !rule.Host && !rule.IP ? false : true;
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
      const [application, nodes] = await Promise.all([
        this.KubernetesApplicationService.get(this.state.params.namespace, this.state.params.name),
        this.KubernetesNodeService.get(),
      ]);
      this.application = application;
      this.allContainers = KubernetesApplicationHelper.associateAllContainersAndApplication(application);
      this.formValues.Note = this.application.Note;
      if (this.application.Note) {
        this.state.expandedNote = true;
      }
      if (this.application.CurrentRevision) {
        this.formValues.SelectedRevision = _.find(this.application.Revisions, { revision: this.application.CurrentRevision.revision });
      }

      this.state.useIngress = _.find(application.PublishedPorts, (p) => {
        return this.portHasIngressRules(p);
      });

      this.placements = computePlacements(nodes, this.application);
      this.state.placementWarning = _.find(this.placements, { AcceptsApplication: true }) ? false : true;
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
      placementWarning: false,
      expandedNote: false,
      useIngress: false,
    };

    this.state.activeTab = this.LocalStorage.getActiveTab('application');

    this.formValues = {
      Note: '',
      SelectedRevision: undefined,
    };

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
