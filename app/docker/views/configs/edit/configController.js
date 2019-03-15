import angular from 'angular';

class ConfigController {
  /* @ngInject */
  constructor($transition$, $state, ConfigService, Notifications) {
    this.$transition$ = $transition$;
    this.$state = $state;
    this.ConfigService = ConfigService;
    this.Notifications = Notifications;
  }

  async removeConfig(configId) {
    try {
      await this.ConfigService.remove(configId);
      this.Notifications.success('Config successfully removed');
      this.$state.go('docker.configs', {});
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to remove config');
    }
  }

  async $onInit() {
    try {
      let data = await this.ConfigService.config(this.$transition$.params().id)
      this.config = data;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve config details');
    }
  }
}

export default ConfigController;
angular.module('portainer.docker').controller('ConfigController', ConfigController);
