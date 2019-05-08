import angular from 'angular';

class RolesController {

  /* @ngInject */
  constructor($state, Notifications, RoleService, ExtensionService) {
    // this.$state = $state;
    this.Notifications = Notifications;
    this.RoleService = RoleService;
    this.ExtensionService = ExtensionService;

    // this.removeAction = this.removeAction.bind(this);
  }

  async $onInit() {
    this.roles = [];
    this.rbacEnabled = false;

    try {
      this.rbacEnabled = await this.ExtensionService.extensionEnabled(this.ExtensionService.EXTENSIONS.RBAC);
      this.roles = await this.RoleService.roles();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve roles');
    }
  }

  // async removeAction(selectedItems) {
  //   let actionCount = selectedItems.length;
  //   for (const config of selectedItems) {
  //     try {
  //       await this.ConfigService.remove(config.Id);
  //       this.Notifications.success('Config successfully removed', config.Name);
  //       const index = this.configs.indexOf(config);
  //       this.configs.splice(index, 1);
  //     } catch (err) {
  //       this.Notifications.error('Failure', err, 'Unable to remove config');
  //     } finally {
  //       --actionCount;
  //       if (actionCount === 0) {
  //         this.$state.reload();
  //       }
  //     }
  //   }
  // }
}
export default RolesController;
angular.module('portainer.extensions.rbac').controller('RolesController', RolesController);
