import angular from 'angular';
import _ from 'lodash-es';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/kubernetesResourceReservationHelper';
import {KubernetesResourceReservation} from 'Kubernetes/models/resource-reservation/models';

class KubernetesNodeController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesNodeService, KubernetesEventService, KubernetesPodService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getNodeAsync = this.getNodeAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
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

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      this.events = await this.KubernetesEventService.get();
      this.events = _.filter(this.events.items, (item) => item.involvedObject.kind === 'Node');
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
  }

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get();

      this.resourceReservation = new KubernetesResourceReservation();
      this.applications = _.map(this.applications, (app) => {
        const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(app.Pods);
        app.CPU = resourceReservation.CPU;
        app.Memory = resourceReservation.Memory;
        this.resourceReservation.CPU += resourceReservation.CPU;
        this.resourceReservation.Memory += resourceReservation.Memory;
        return app;
      });
      this.applications = _.filter(this.applications, (app) => _.map(app.Pods, (pod) => pod.Node).includes(this.node.Name).length !== 0);
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
      dataLoading: true,
      eventsLoading: true,
      applicationsLoading: true,
      showEditorTab: false
    };

    await this.getNode();
    await this.getEvents();
    await this.getApplications();
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesNodeController;
angular.module('portainer.kubernetes').controller('KubernetesNodeController', KubernetesNodeController);
