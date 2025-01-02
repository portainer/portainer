import angular from 'angular';
import _ from 'lodash-es';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';
import KubernetesNodeConverter from 'Kubernetes/node/converter';
import { KubernetesNodeLabelFormValues, KubernetesNodeTaintFormValues } from 'Kubernetes/node/formValues';
import { KubernetesNodeTaintEffects, KubernetesNodeAvailabilities } from 'Kubernetes/node/models';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import { KubernetesNodeHelper } from 'Kubernetes/node/helper';
import { confirmUpdateNode } from '@/react/kubernetes/cluster/NodeView/ConfirmUpdateNode';
import { getMetricsForNode, getTotalResourcesForAllApplications } from '@/react/kubernetes/metrics/metrics.ts';

class KubernetesNodeController {
  /* @ngInject */
  constructor(
    $async,
    $state,
    Notifications,
    LocalStorage,
    KubernetesNodeService,
    KubernetesEventService,
    KubernetesPodService,
    KubernetesApplicationService,
    KubernetesEndpointService,
    Authentication
  ) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesEndpointService = KubernetesEndpointService;
    this.Authentication = Authentication;

    this.onInit = this.onInit.bind(this);
    this.getNodesAsync = this.getNodesAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getEndpointsAsync = this.getEndpointsAsync.bind(this);
    this.updateNodeAsync = this.updateNodeAsync.bind(this);
    this.drainNodeAsync = this.drainNodeAsync.bind(this);
    this.hasResourceUsageAccess = this.hasResourceUsageAccess.bind(this);
    this.getNodeUsageAsync = this.getNodeUsageAsync.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('node', index);
  }

  /* #region taint */

  onChangeTaintKey(index) {
    this.state.duplicateTaintKeys = KubernetesFormValidationHelper.getDuplicates(
      _.map(this.formValues.Taints, (taint) => {
        if (taint.NeedsDeletion) {
          return undefined;
        }
        return taint.Key;
      })
    );
    this.state.hasDuplicateTaintKeys = Object.keys(this.state.duplicateTaintKeys).length > 0;
    this.onChangeTaint(index);
  }

  onChangeTaint(index) {
    if (this.formValues.Taints[index]) {
      this.formValues.Taints[index].IsChanged = true;
    }
  }

  addTaint() {
    const taint = new KubernetesNodeTaintFormValues();
    taint.IsNew = true;
    taint.Effect = KubernetesNodeTaintEffects.NOSCHEDULE;
    this.formValues.Taints.push(taint);
  }

  removeTaint(index) {
    const taint = this.formValues.Taints[index];
    if (taint.IsNew) {
      this.formValues.Taints.splice(index, 1);
    } else {
      taint.NeedsDeletion = true;
    }
    this.onChangeTaintKey();
  }

  restoreTaint(index) {
    this.formValues.Taints[index].NeedsDeletion = false;
    this.onChangeTaintKey();
  }

  computeTaintsWarning() {
    return _.filter(this.formValues.Taints, (taint) => {
      return taint.Effect === KubernetesNodeTaintEffects.NOEXECUTE && (taint.IsNew || taint.IsChanged);
    }).length;
  }

  /* #endregion */

  /* #region label */

  onChangeLabelKey(index) {
    this.state.duplicateLabelKeys = KubernetesFormValidationHelper.getDuplicates(
      _.map(this.formValues.Labels, (label) => {
        if (label.NeedsDeletion) {
          return undefined;
        }
        return label.Key;
      })
    );
    this.state.hasDuplicateLabelKeys = Object.keys(this.state.duplicateLabelKeys).length > 0;
    this.onChangeLabel(index);
  }

  onChangeLabel(index) {
    if (this.formValues.Labels[index]) {
      this.formValues.Labels[index].IsChanged = true;
    }
  }

  addLabel() {
    const label = new KubernetesNodeLabelFormValues();
    label.IsNew = true;
    this.formValues.Labels.push(label);
  }

  removeLabel(index) {
    const label = this.formValues.Labels[index];
    if (label.IsNew) {
      this.formValues.Labels.splice(index, 1);
    } else {
      label.NeedsDeletion = true;
    }
    this.onChangeLabelKey();
  }

  restoreLabel(index) {
    this.formValues.Labels[index].NeedsDeletion = false;
    this.onChangeLabelKey();
  }

  isSystemLabel(index) {
    return KubernetesNodeHelper.isSystemLabel(this.formValues.Labels[index]);
  }

  computeLabelsWarning() {
    return _.filter(this.formValues.Labels, (label) => {
      return label.IsUsed && (label.NeedsDeletion || label.IsChanged);
    }).length;
  }

  /* #endregion */

  /* #region cordon */

  computeCordonWarning() {
    return this.formValues.Availability === this.availabilities.PAUSE;
  }

  /* #endregion */

  /* #region drain */

  computeDrainWarning() {
    return this.formValues.Availability === this.availabilities.DRAIN;
  }

  async drainNodeAsync() {
    const pods = _.flatten(_.map(this.applications, (app) => app.Pods));
    let actionCount = pods.length;
    for (const pod of pods) {
      try {
        await this.KubernetesPodService.eviction(pod);
        this.Notifications.success('Pod successfully evicted', pod.Name);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to evict pod');
        this.formValues.Availability = this.availabilities.PAUSE;
        await this.KubernetesNodeService.patch(this.node, this.formValues);
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.formValues.Availability = this.availabilities.PAUSE;
          await this.KubernetesNodeService.patch(this.node, this.formValues);
        }
      }
    }
  }

  drainNode() {
    return this.$async(this.drainNodeAsync);
  }

  /* #endregion */

  /* #region actions */

  isNoChangesMade() {
    const newNode = KubernetesNodeConverter.formValuesToNode(this.node, this.formValues);
    const payload = KubernetesNodeConverter.patchPayload(this.node, newNode);
    return !payload.length;
  }

  isDrainError() {
    return (this.state.isDrainOperation || this.state.isContainPortainer) && this.formValues.Availability === this.availabilities.DRAIN;
  }

  isFormValid() {
    return !this.state.hasDuplicateTaintKeys && !this.state.hasDuplicateLabelKeys && !this.isNoChangesMade() && !this.isDrainError();
  }

  resetFormValues() {
    this.formValues = KubernetesNodeConverter.nodeToFormValues(this.node);
  }

  /* #endregion */

  async getEndpointsAsync() {
    try {
      const endpoints = await this.KubernetesEndpointService.get();
      this.endpoint = _.find(endpoints, { Name: 'kubernetes' });
      if (this.endpoint && this.endpoint.Subsets) {
        _.forEach(this.endpoint.Subsets, (subset) => {
          return _.forEach(subset.Ips, (ip) => {
            if (ip === this.node.IPAddress) {
              this.node.Api = true;
              this.node.Port = subset.Port;
              return false;
            }
          });
        });
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environments');
    }
  }

  getEndpoints() {
    return this.$async(this.getEndpointsAsync);
  }

  async updateNodeAsync() {
    try {
      this.node = await this.KubernetesNodeService.patch(this.node, this.formValues);
      if (this.formValues.Availability === 'Drain') {
        await this.drainNode();
      }
      this.Notifications.success('Success', 'Node updated successfully');
      this.$state.reload(this.$state.current);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update node');
    }
  }

  updateNode() {
    const taintsWarning = this.computeTaintsWarning();
    const labelsWarning = this.computeLabelsWarning();
    const cordonWarning = this.computeCordonWarning();
    const drainWarning = this.computeDrainWarning();

    if (taintsWarning || labelsWarning || cordonWarning || drainWarning) {
      confirmUpdateNode(taintsWarning, labelsWarning, cordonWarning, drainWarning).then((confirmed) => {
        if (confirmed) {
          return this.$async(this.updateNodeAsync);
        }
      });
    } else {
      return this.$async(this.updateNodeAsync);
    }
  }

  async getNodesAsync() {
    try {
      this.state.dataLoading = true;
      const nodeName = this.$transition$.params().nodeName;
      this.nodes = await this.KubernetesNodeService.get();
      this.node = _.find(this.nodes, { Name: nodeName });
      this.state.isDrainOperation = _.find(this.nodes, { Availability: this.availabilities.DRAIN });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve node');
    } finally {
      this.state.dataLoading = false;
    }
  }

  getNodes() {
    return this.$async(this.getNodesAsync);
  }

  hasResourceUsageAccess() {
    return this.state.isAdmin && this.state.useServerMetrics;
  }

  async getNodeUsageAsync() {
    try {
      const nodeName = this.$transition$.params().nodeName;
      const node = await getMetricsForNode(this.$state.params.endpointId, nodeName);
      node.CPU = node.usage.cpu;
      node.Memory = KubernetesResourceReservationHelper.megaBytesValue(node.usage.memory);
      this.resourceUsage = new KubernetesResourceReservation();
      this.resourceUsage.CPU = KubernetesResourceReservationHelper.parseCPU(node.usage.cpu);
      this.resourceUsage.Memory = KubernetesResourceReservationHelper.megaBytesValue(node.usage.memory);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve node resource usage');
    }
  }

  getNodeUsage() {
    if (this.hasResourceUsageAccess()) {
      return this.$async(this.getNodeUsageAsync);
    }
  }

  hasEventWarnings() {
    return this.state.eventWarningCount;
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.get();
      this.events = events.filter((item) => item.Involved.uid === this.node.Id);
      this.state.eventWarningCount = KubernetesEventHelper.warningCount(this.events);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve node events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  showEditor() {
    this.state.showEditorTab = true;
    this.selectTab(2);
  }

  async onInit() {
    this.availabilities = KubernetesNodeAvailabilities;

    this.state = {
      isAdmin: this.Authentication.isAdmin(),
      activeTab: this.LocalStorage.getActiveTab('node'),
      currentName: this.$state.$current.name,
      dataLoading: true,
      eventsLoading: true,
      applicationsLoading: true,
      showEditorTab: false,
      viewReady: false,
      eventWarningCount: 0,
      duplicateTaintKeys: [],
      hasDuplicateTaintKeys: false,
      duplicateLabelKeys: [],
      hasDuplicateLabelKeys: false,
      isDrainOperation: false,
      isContainPortainer: false,
      useServerMetrics: this.endpoint.Kubernetes.Configuration.UseServerMetrics,
    };

    // getEvents depends on nodes, so get nodes first
    await this.getNodes();
    await Promise.allSettled([this.getEvents(), this.getEndpoints(), this.getNodeUsage()]);

    this.availableEffects = _.values(KubernetesNodeTaintEffects);
    this.formValues = KubernetesNodeConverter.nodeToFormValues(this.node);
    this.formValues.Labels = KubernetesNodeHelper.computeUsedLabels(this.applications, this.formValues.Labels);
    this.formValues.Labels = KubernetesNodeHelper.reorderLabels(this.formValues.Labels);

    this.resourceReservation = await getTotalResourcesForAllApplications(this.$state.params.endpointId, this.node.Name);
    this.resourceReservation.MemoryRequest = KubernetesResourceReservationHelper.megaBytesValue(this.resourceReservation.MemoryRequest);
    this.node.Memory = KubernetesResourceReservationHelper.megaBytesValue(this.node.Memory);

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('node', 0);
    }
  }
}

export default KubernetesNodeController;
angular.module('portainer.kubernetes').controller('KubernetesNodeController', KubernetesNodeController);
