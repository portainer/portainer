import angular from 'angular';
import _ from 'lodash-es';

class KubernetesNodeController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesNodeService, KubernetesEventService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesEventService = KubernetesEventService;

    this.getNode = this.getNode.bind(this);
    this.getNodeAsync = this.getNodeAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  changeEditorContent(key) {
    this.selectedData.Key = key;
    this.selectedData.Value = this.node.Data[key];
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  getNode() {
    return this.$async(this.getNodeAsync);
  }

  async $onInit() {
    this.state = {
      DisplayedPanel: 'conditions',
      eventsLoading: true,
      dataLoading: true
    };
    this.getNode();
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.events();
      this.events = _.filter(events, (event) => event.Involved.uid === this.node.Id);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve node events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  async getNodeAsync() {
    try {
      this.state.dataLoading = true;
      this.nodeName = this.$transition$.params().name;
      this.node = await this.KubernetesNodeService.node(this.nodeName);
      await this.getEventsAsync();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve node details');
    } finally {
      this.state.dataLoading = false;
    }
  }
}

export default KubernetesNodeController;
angular.module('portainer.kubernetes').controller('KubernetesNodeController', KubernetesNodeController);
