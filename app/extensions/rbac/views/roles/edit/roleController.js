import angular from 'angular';

class RoleController {

  /* @ngInject */
  constructor($transition$, RoleService) {
    this.$transition$ = $transition$;
    this.RoleService = RoleService;
  }

  async $onInit() {
    var roleId = this.$transition$.params().id;

    this.role = {};
    try {
      this.role = await this.RoleService.role(roleId);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve role');
    }
  }
}
export default RoleController;
angular.module('portainer.extensions.rbac').controller('RoleController', RoleController);
