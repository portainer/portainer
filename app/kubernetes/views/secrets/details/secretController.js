import angular from 'angular';
import _ from 'lodash-es';

class KubernetesSecretController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesSecretService, KubernetesEventService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesSecretService = KubernetesSecretService;
    this.KubernetesEventService = KubernetesEventService;

    this.getSecret = this.getSecret.bind(this);
    this.getSecretAsync = this.getSecretAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
  }

  changeEditorContent(key) {
    this.selectedData.Key = key;
    this.selectedData.Value = this.secret.Data[key];
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  getSecret() {
    return this.$async(this.getSecretAsync);
  }

  async $onInit() {
    this.state = {
      DisplayedPanel: 'details',
      eventsLoading: true,
      dataLoading: true
    };
    this.getSecret();
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      const events = await this.KubernetesEventService.events(this.namespace);
      this.events = _.filter(events, (event) => event.Involved.uid === this.secret.Id);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve secret events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  async getSecretAsync() {
    try {
      this.state.dataLoading = true;
      this.namespace = this.$transition$.params().namespace;
      this.secretName = this.$transition$.params().name;
      this.secret = await this.KubernetesSecretService.secret(this.namespace, this.secretName);

      const keys = _.keys(this.secret.Data);
      if (this.secret.Data && keys.length) {
        this.selectedData = {
          Key: keys[0],
          Value: this.secret.Data[keys[0]]
        }
      }
      await this.getEventsAsync();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve secret details');
    } finally {
      this.state.dataLoading = false;
    }
  }
}

export default KubernetesSecretController;
angular.module('portainer.kubernetes').controller('KubernetesSecretController', KubernetesSecretController);
