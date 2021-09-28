import angular from 'angular';
import { RoleTypes } from '../../models/role';

export default class RolesDatatableController {
  /* @ngInject */
  constructor($controller, $scope) {
    this.limitedFeature = 'rbac-roles';

    angular.extend(this, $controller('GenericDatatableController', { $scope }));
  }

  isDefaultItem(item) {
    return item.ID === RoleTypes.STANDARD;
  }
}
