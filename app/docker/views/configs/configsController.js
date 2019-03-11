import angular from 'angular';

class ConfigsController {

  /* @ngInject */
  constructor($state, ConfigService, Notifications) {
    this.$state = $state;
    this.ConfigService = ConfigService;
    this.Notifications = Notifications;
  }

  async $onInit() {
    this.configs = [];
    try {
      this.configs = await this.ConfigService.configs();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configs');
    }
  }

  async removeAction(selectedItems) {
    let actionCount = selectedItems.length;
    for (const config of selectedItems) {
      try {
        await this.ConfigService.remove(config.id);
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
