import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';

class KubernetesClusterController {
  /* @ngInject */
  constructor($async, $state, Authentication, Notifications, LocalStorage, KubernetesNodeService, KubernetesApplicationService, KubernetesComponentStatusesService) {
    this.$async = $async;
    this.$state = $state;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesComponentStatusesService = KubernetesComponentStatusesService;

    this.onInit = this.onInit.bind(this);
    this.getNodes = this.getNodes.bind(this);
    this.getNodesAsync = this.getNodesAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.getComponentStatuses = this.getComponentStatuses.bind(this);
    this.getComponentStatusesAsync = this.getComponentStatusesAsync.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('cluster', index);
  }

  async getComponentStatusesAsync() {
    try {
      this.componentStatuses = await this.KubernetesComponentStatusesService.get();
      this.componentStatuses = _.forEach(this.componentStatuses, (status) => {
        if (status.conditions && status.conditions[0].message === '{"health":"true"}') {
          status.conditions[0].message = 'ok';
        }
      });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to get component status');
    }
  }

  getComponentStatuses() {
    return this.$async(this.getComponentStatusesAsync);
  }

  async getNodesAsync() {
    try {
      const nodes = await this.KubernetesNodeService.get();
      _.forEach(nodes, (node) => (node.Memory = filesizeParser(node.Memory)));
      this.nodes = nodes;
      this.CPULimit = _.reduce(this.nodes, (acc, node) => node.CPU + acc, 0);
      this.MemoryLimit = _.reduce(this.nodes, (acc, node) => KubernetesResourceReservationHelper.megaBytesValue(node.Memory) + acc, 0);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve nodes');
    }
  }

  getNodes() {
    return this.$async(this.getNodesAsync);
  }

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get();
      const nodeNames = _.map(this.nodes, (node) => node.Name);
      this.resourceReservation = _.reduce(
        this.applications,
        (acc, app) => {
          app.Pods = _.filter(app.Pods, (pod) => nodeNames.includes(pod.Node));
          const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(app.Pods);
          acc.CPU += resourceReservation.CPU;
          acc.Memory += resourceReservation.Memory;
          return acc;
        },
        new KubernetesResourceReservation()
      );
      this.resourceReservation.Memory = KubernetesResourceReservationHelper.megaBytesValue(this.resourceReservation.Memory);
    } catch (err) {
      this.Notifications.error('Failure', 'Unable to retrieve applications', err);
    } finally {
      this.state.applicationsLoading = false;
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.state = {
      applicationsLoading: true,
      viewReady: false,
      activeTab: 0,
      currentName: this.$state.$current.name,
    };

    this.state.activeTab = this.LocalStorage.getActiveTab('cluster');

    this.isAdmin = this.Authentication.isAdmin();

    await this.getNodes();
    await this.getComponentStatuses();
    if (this.isAdmin) {
      await this.getApplications();
    }

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('cluster', 0);
    }
  }
}

export default KubernetesClusterController;
angular.module('portainer.kubernetes').controller('KubernetesClusterController', KubernetesClusterController);
