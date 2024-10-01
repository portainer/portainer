import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';
import { getMetricsForAllNodes, getTotalResourcesForAllApplications } from '@/react/kubernetes/metrics/metrics.ts';

class KubernetesClusterController {
  /* @ngInject */
  constructor($async, $state, Notifications, LocalStorage, Authentication, KubernetesNodeService, KubernetesApplicationService, KubernetesEndpointService, EndpointService) {
    this.$async = $async;
    this.$state = $state;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesEndpointService = KubernetesEndpointService;
    this.EndpointService = EndpointService;

    this.onInit = this.onInit.bind(this);
    this.getNodes = this.getNodes.bind(this);
    this.getNodesAsync = this.getNodesAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.getEndpointsAsync = this.getEndpointsAsync.bind(this);
    this.hasResourceUsageAccess = this.hasResourceUsageAccess.bind(this);
  }

  async getEndpointsAsync() {
    try {
      const endpoints = await this.KubernetesEndpointService.get();
      const systemEndpoints = _.filter(endpoints, { Namespace: 'kube-system' });
      this.systemEndpoints = _.filter(systemEndpoints, (ep) => ep.HolderIdentity);

      const kubernetesEndpoint = _.find(endpoints, { Name: 'kubernetes' });
      if (kubernetesEndpoint && kubernetesEndpoint.Subsets) {
        const ips = _.flatten(_.map(kubernetesEndpoint.Subsets, 'Ips'));
        _.forEach(this.nodes, (node) => {
          node.Api = _.includes(ips, node.IPAddress);
        });
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environments');
    }
  }

  getEndpoints() {
    return this.$async(this.getEndpointsAsync);
  }

  async getNodesAsync() {
    try {
      const nodes = await this.KubernetesNodeService.get();
      _.forEach(nodes, (node) => (node.Memory = filesizeParser(node.Memory)));
      this.nodes = nodes;
      this.CPULimit = _.reduce(this.nodes, (acc, node) => node.CPU + acc, 0);
      this.CPULimit = Math.round(this.CPULimit * 10000) / 10000;
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

      const applicationsResources = await getTotalResourcesForAllApplications(this.endpoint.Id);
      this.resourceReservation = new KubernetesResourceReservation();
      this.resourceReservation.CPU = Math.round(applicationsResources.CpuRequest / 1000);
      this.resourceReservation.Memory = KubernetesResourceReservationHelper.megaBytesValue(applicationsResources.MemoryRequest);

      if (this.hasResourceUsageAccess()) {
        await this.getResourceUsage(this.endpoint.Id);
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    } finally {
      this.state.applicationsLoading = false;
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async getResourceUsage(endpointId) {
    try {
      const nodeMetrics = await getMetricsForAllNodes(endpointId);
      const resourceUsageList = nodeMetrics.items.map((i) => i.usage);
      const clusterResourceUsage = resourceUsageList.reduce((total, u) => {
        total.CPU += KubernetesResourceReservationHelper.parseCPU(u.cpu);
        total.Memory += KubernetesResourceReservationHelper.megaBytesValue(u.memory);
        return total;
      }, new KubernetesResourceReservation());
      this.resourceUsage = clusterResourceUsage;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve cluster resource usage');
    }
  }

  /**
   * Check if resource usage stats can be displayed
   * @returns {boolean}
   */
  hasResourceUsageAccess() {
    return this.isAdmin && this.state.useServerMetrics;
  }

  async onInit() {
    this.endpoint = await this.EndpointService.endpoint(this.endpoint.Id);
    this.isAdmin = this.Authentication.isAdmin();
    const useServerMetrics = this.endpoint.Kubernetes.Configuration.UseServerMetrics;

    this.state = {
      applicationsLoading: true,
      viewReady: false,
      useServerMetrics,
    };

    await this.getNodes();
    if (this.isAdmin) {
      await Promise.allSettled([this.getEndpoints(), this.getApplicationsAsync()]);
    }

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesClusterController;
angular.module('portainer.kubernetes').controller('KubernetesClusterController', KubernetesClusterController);
