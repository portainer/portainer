import angular from 'angular';

class ConfigsController {
  /* @ngInject */
  constructor($state, ConfigService, Notifications, $async, endpoint) {
    this.$state = $state;
    this.ConfigService = ConfigService;
    this.Notifications = Notifications;
    this.$async = $async;
    this.endpoint = endpoint;

    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.getConfigs = this.getConfigs.bind(this);
    this.getConfigsAsync = this.getConfigsAsync.bind(this);
  }

  getConfigs() {
    return this.$async(this.getConfigsAsync);
  }

  async getConfigsAsync() {
    try {
      this.configs = await this.ConfigService.configs(this.endpoint.Id);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configs');
    }
  }

  async $onInit() {
    this.configs = [];
    this.getConfigs();
  }

  async removeAction(selectedItems) {
    return this.$async(this.removeActionAsync, selectedItems);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const config of selectedItems) {
      try {
        await this.ConfigService.remove(this.endpoint.Id, config.Id);
        this.Notifications.success('Config successfully removed', config.Name);
        const index = this.configs.indexOf(config);
        this.configs.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove config');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }
}
export default ConfigsController;
angular.module('portainer.docker').controller('ConfigsController', ConfigsController);
