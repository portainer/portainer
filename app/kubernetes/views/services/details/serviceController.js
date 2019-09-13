import angular from 'angular';
import _ from 'lodash-es';

class KubernetesServiceController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesServiceService, KubernetesEventService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesServiceService = KubernetesServiceService;
    this.KubernetesEventService = KubernetesEventService;

    this.getService = this.getService.bind(this);
    this.getServiceAsync = this.getServiceAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  getService() {
    return this.$async(this.getServiceAsync);
  }

  async $onInit() {
    this.state = {
      DisplayedPanel: 'containers',
      eventsLoading: true,
      dataLoading: true
    };
    this.getService().then(() => this.getEvents());
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.events();
      this.events = _.filter(events, (event) => event.Involved.uid === this.service.Id);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve service events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  async getServiceAsync() {
    try {
      this.state.dataLoading = true;
      this.serviceName = this.$transition$.params().name;
      this.namespace = this.$transition$.params().namespace;
      this.service = await this.KubernetesServiceService.service(this.namespace, this.serviceName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve service details');
    } finally {
      this.state.dataLoading = false;
    }
  }
}

export default KubernetesServiceController;
angular.module('portainer.kubernetes').controller('KubernetesServiceController', KubernetesServiceController);
