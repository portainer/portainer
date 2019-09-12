import angular from 'angular';
import _ from 'lodash-es';

class KubernetesConfigController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesConfigService, KubernetesEventService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesConfigService = KubernetesConfigService;
    this.KubernetesEventService = KubernetesEventService;

    this.getConfig = this.getConfig.bind(this);
    this.getConfigAsync = this.getConfigAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  changeEditorContent(key) {
    this.selectedData.Key = key;
    this.selectedData.Value = this.config.Data[key];
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  getConfig() {
    return this.$async(this.getConfigAsync);
  }

  async $onInit() {
    this.state = {
      DisplayedPanel: 'details'
    };
    this.getConfig();
  }

  async getEventsAsync() {
    try {
      const events = await this.KubernetesEventService.events(this.namespace);
      this.events = _.filter(events, (event) => event.Involved.uid === this.config.Id);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve config events');
    }
  }

  async getConfigAsync() {
    try {
      this.namespace = this.$transition$.params().namespace;
      this.configName = this.$transition$.params().name;
      this.config = await this.KubernetesConfigService.config(this.namespace, this.configName);

      const keys = _.keys(this.config.Data);
      if (this.config.Data && keys.length) {
        this.selectedData = {
          Key: keys[0],
          Value: this.config.Data[keys[0]]
        }
      }
      await this.getEventsAsync();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve config details');
    }
  }
}

export default KubernetesConfigController;
angular.module('portainer.kubernetes').controller('KubernetesConfigController', KubernetesConfigController);
