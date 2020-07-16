import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';

class KubernetesClusterController {
  /* @ngInject */
  constructor($async, $state, Authentication, Notifications, LocalStorage, KubernetesNodeService, KubernetesApplicationService, KubernetesComponentStatusService) {
    this.$async = $async;
    this.$state = $state;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesComponentStatusService = KubernetesComponentStatusService;

    this.onInit = this.onInit.bind(this);
    this.getNodes = this.getNodes.bind(this);
    this.getNodesAsync = this.getNodesAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.getComponentStatus = this.getComponentStatus.bind(this);
    this.getComponentStatusAsync = this.getComponentStatusAsync.bind(this);
  }

  async getComponentStatusAsync() {
    try {
      this.ComponentStatuses = await this.KubernetesComponentStatusService.get();
      this.hasUnhealthyComponentStatus = _.find(this.ComponentStatuses, { Healthy: false }) ? true : false;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve cluster component statuses');
    }
  }

  getComponentStatus() {
    return this.$async(this.getComponentStatusAsync);
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
      hasUnhealthyComponentStatus: false,
    };

    this.isAdmin = this.Authentication.isAdmin();

    await this.getNodes();
    if (this.isAdmin) {
      await this.getComponentStatus();
      await this.getApplications();
    }

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesClusterController;
angular.module('portainer.kubernetes').controller('KubernetesClusterController', KubernetesClusterController);
