import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/kubernetesResourceReservationHelper';

class KubernetesNodeController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesNodeService, KubernetesEventService, KubernetesPodService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getNodeAsync = this.getNodeAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getPodsAsync = this.getPodsAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.getPodsApplications = this.getPodsApplications.bind(this);
    this.getPodsApplicationsAsync = this.getPodsApplicationsAsync.bind(this);
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
      this.events = await this.KubernetesEventService.events();
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

  async getPodsAsync() {
    try {
      this.state.podsLoading = true;
      const pods = await this.KubernetesPodService.pods();
      this.pods = _.filter(pods, pod => pod.Node === this.node.Name);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve pods');
    } finally {
      this.state.podsLoading = false;
    }
  }

  getPods() {
    return this.$async(this.getPodsAsync);
  }

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get();

      this.ResourceReservation = { CPU: 0, Memory: 0 };
      this.applications = _.map(this.applications, app => {
        const pods = _.filter(this.pods, pod => Object.values(pod.Metadata.labels).includes(app.Name));
        const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(pods);
        app.CPU = resourceReservation.CPU;
        app.Memory = resourceReservation.Memory;
        this.ResourceReservation.CPU += resourceReservation.CPU;
        this.ResourceReservation.Memory += resourceReservation.Memory;
        return app;
      });
      this.ResourceReservation.Memory = Math.floor(this.ResourceReservation.Memory / 1000 / 1000);
      this.memoryLimit = Math.floor(filesizeParser(this.node.Memory) / 1000 / 1000);
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
      podsLoading: true,
      applicationsLoading: true,
      showEditorTab: false
    };

    await this.getNode();
    await this.getEvents();
    await this.getPodsApplications();
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  async getPodsApplicationsAsync() {
    await this.getPods();
    await this.getApplications();
  }

  getPodsApplications() {
    return this.$async(this.getPodsApplicationsAsync);
  }
}

export default KubernetesNodeController;
angular.module('portainer.kubernetes').controller('KubernetesNodeController', KubernetesNodeController);
