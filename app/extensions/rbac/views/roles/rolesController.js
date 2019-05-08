import angular from 'angular';

class RolesController {

  /* @ngInject */
  constructor(Notifications, RoleService, ExtensionService) {
    this.Notifications = Notifications;
    this.RoleService = RoleService;
    this.ExtensionService = ExtensionService;
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
}
export default RolesController;
angular.module('portainer.extensions.rbac').controller('RolesController', RolesController);
