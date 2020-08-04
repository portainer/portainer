import angular from 'angular';
import _ from 'lodash-es';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';

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
    KubernetesEndpointService
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

    this.onInit = this.onInit.bind(this);
    this.getNodeAsync = this.getNodeAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.getEndpointsAsync = this.getEndpointsAsync.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('node', index);
  }

  async getEndpointsAsync() {
    try {
      const endpoints = await this.KubernetesEndpointService.get();
      this.endpoint = _.find(endpoints, { Name: 'kubernetes' });
      if (this.endpoint && this.endpoint.Subsets) {
        const ips = _.flatten(_.map(this.endpoint.Subsets, 'Ips'));
        const ports = _.flatten(_.map(this.endpoint.Subsets, 'Ports'));
        _.forEach(ips, (ip, index) => {
          if (ip === this.node.IPAddress) {
            this.node.Port = ports[index];
            this.node.Api = true;
          }
        });
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve endpoints');
    }
  }

  getEndpoints() {
    return this.$async(this.getEndpointsAsync);
  }

  async getNodeAsync() {
    try {
      this.state.dataLoading = true;
      const nodeName = this.$transition$.params().name;
      this.node = await this.KubernetesNodeService.get(nodeName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve node');
    } finally {
      this.state.dataLoading = false;
    }
  }

  getNode() {
    return this.$async(this.getNodeAsync);
  }

  hasEventWarnings() {
    return this.state.eventWarningCount;
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      this.events = await this.KubernetesEventService.get();
      this.events = _.filter(this.events.items, (item) => item.involvedObject.kind === 'Node');
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

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get();

      this.resourceReservation = new KubernetesResourceReservation();
      this.applications = _.map(this.applications, (app) => {
        app.Pods = _.filter(app.Pods, (pod) => pod.Node === this.node.Name);
        return app;
      });
      this.applications = _.filter(this.applications, (app) => app.Pods.length !== 0);
      this.applications = _.map(this.applications, (app) => {
        const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(app.Pods);
        app.CPU = resourceReservation.CPU;
        app.Memory = resourceReservation.Memory;
        this.resourceReservation.CPU += resourceReservation.CPU;
        this.resourceReservation.Memory += resourceReservation.Memory;
        return app;
      });
      this.resourceReservation.Memory = KubernetesResourceReservationHelper.megaBytesValue(this.resourceReservation.Memory);
      this.memoryLimit = KubernetesResourceReservationHelper.megaBytesValue(this.node.Memory);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    } finally {
      this.state.applicationsLoading = false;
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.state = {
      activeTab: 0,
      currentName: this.$state.$current.name,
      dataLoading: true,
      eventsLoading: true,
      applicationsLoading: true,
      showEditorTab: false,
      viewReady: false,
      eventWarningCount: 0,
    };

    this.state.activeTab = this.LocalStorage.getActiveTab('node');

    await this.getNode();
    await this.getEvents();
    await this.getApplications();
    await this.getEndpoints();

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
