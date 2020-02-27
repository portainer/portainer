import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

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
      this.ResourceReservation = this.computePodsResourceReservation(this.pods);
      this.ResourceReservation.Memory = Math.floor(this.ResourceReservation.Memory / 1000 / 1000);
      this.memoryLimit = Math.floor(filesizeParser(this.node.Memory) / 1000 / 1000);
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
      this.applications = await this.KubernetesApplicationService.applications();

      this.applications = _.map(this.applications, app => {
        app.pods = _.filter(this.pods, pod => Object.values(pod.Metadata.labels).includes(app.Name));

        const resourceReservation = this.computePodsResourceReservation(app.pods);
        app.CPU = resourceReservation.CPU;
        app.Memory = resourceReservation.Memory;
        return app;
      });
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
    this.getEvents();
    this.getPodsApplications();
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  async getPodsApplicationsAsync() {
    await this.getPods();
    this.getApplications();
  }

  getPodsApplications() {
    return this.$async(this.getPodsApplicationsAsync);
  }

  computePodsResourceReservation(pods) {
    const containers = _.reduce(pods, (acc, pod) => _.concat(acc, pod.Containers), []);

    return _.reduce(containers, (acc, container) => {
      if (container.resources && container.resources.limits) {
        
        if (container.resources.limits.memory) {
          acc.Memory += filesizeParser(
            container.resources.limits.memory,
            { base: 10 }
          );
        }
        
        if (container.resources.limits.cpu) {
          const cpu = parseInt(container.resources.limits.cpu);
          if (_.endsWith(container.resources.limits.cpu, 'm')) {
            acc.CPU += cpu / 1000;
          } else {
            acc.CPU += cpu;
          }
        }
      }
      return acc;
    }, { Memory: 0, CPU: 0 });
  }
}

export default KubernetesNodeController;
angular.module('portainer.kubernetes').controller('KubernetesNodeController', KubernetesNodeController);