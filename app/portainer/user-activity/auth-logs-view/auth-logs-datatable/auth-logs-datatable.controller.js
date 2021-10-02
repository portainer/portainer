import { authenticationMethodTypesMap, authenticationMethodTypesLabels } from '@/portainer/settings/authentication/auth-method-constants';
import { authenticationActivityTypesMap, authenticationActivityTypesLabels } from '@/portainer/settings/authentication/auth-type-constants';

class ActivityLogsDatatableController {
  /* @ngInject */
  constructor($controller, $scope, PaginationService) {
    this.PaginationService = PaginationService;

    this.tableKey = 'authLogs';

    this.contextFilterLabels = Object.values(authenticationMethodTypesMap).map((value) => ({ value, label: authenticationMethodTypesLabels[value] }));
    this.typeFilterLabels = Object.values(authenticationActivityTypesMap).map((value) => ({ value, label: authenticationActivityTypesLabels[value] }));

    const $onInit = this.$onInit;
    angular.extend(this, $controller('GenericDatatableController', { $scope }));
    this.$onInit = $onInit.bind(this);

    this.changeSort = this.changeSort.bind(this);
    this.handleChangeLimit = this.handleChangeLimit.bind(this);
  }

  changeSort(key) {
    let desc = false;
    if (key === this.sort.key) {
      desc = !this.sort.desc;
    }

    this.onChangeSort({ key, desc });
  }

  contextType(context) {
    if (!(context in authenticationMethodTypesLabels)) {
      return '';
    }
    return authenticationMethodTypesLabels[context];
  }

  activityType(type) {
    if (!(type in authenticationActivityTypesLabels)) {
      return '';
    }
    return authenticationActivityTypesLabels[type];
  }

  isAuthSuccess(type) {
    return type === authenticationActivityTypesMap.AuthSuccess;
  }

  isAuthFailure(type) {
    return type === authenticationActivityTypesMap.AuthFailure;
  }

  handleChangeLimit(limit) {
    this.PaginationService.setPaginationLimit(this.tableKey, limit);
    this.onChangeLimit(limit);
  }

  $onInit() {
    this.$onInitGeneric();

    const limit = this.PaginationService.getPaginationLimit(this.tableKey);
    if (limit) {
      this.handleChangeLimit(+limit);
    }
  }
}

export default ActivityLogsDatatableController;
