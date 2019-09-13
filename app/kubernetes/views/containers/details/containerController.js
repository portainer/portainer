import angular from 'angular';
import _ from 'lodash-es';

class KubernetesContainerController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesContainerService, KubernetesEventService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesContainerService = KubernetesContainerService;
    this.KubernetesEventService = KubernetesEventService;

    this.getContainer = this.getContainer.bind(this);
    this.getContainerAsync = this.getContainerAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  changeEditorContent(key) {
    this.selectedData.Key = key;
    this.selectedData.Value = this.container.Data[key];
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  getContainer() {
    return this.$async(this.getContainerAsync);
  }

  async $onInit() {
    this.state = {
      DisplayedPanel: 'details',
      eventsLoading: true,
      dataLoading: true
    };
    this.getContainer().then(() => this.getEvents());
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.events();
      this.events = _.filter(events, (event) => event.Involved.uid === this.container.Id);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve container events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  async getContainerAsync() {
    try {
      this.state.dataLoading = true;
      this.containerName = this.$transition$.params().name;
      this.namespace = this.$transition$.params().namespace;
      this.container = await this.KubernetesContainerService.container(this.namespace, this.containerName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve container details');
    } finally {
      this.state.dataLoading = false;
    }
  }
}

export default KubernetesContainerController;
angular.module('portainer.kubernetes').controller('KubernetesContainerController', KubernetesContainerController);
