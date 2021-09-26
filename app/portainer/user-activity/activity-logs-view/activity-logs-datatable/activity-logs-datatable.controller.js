export default class ActivityLogsDatatableController {
  /* @ngInject */
  constructor($controller, $scope, PaginationService) {
    this.PaginationService = PaginationService;

    this.tableKey = 'authLogs';

    const $onInit = this.$onInit;
    angular.extend(this, $controller('GenericDatatableController', { $scope }));

    this.changeSort = this.changeSort.bind(this);
    this.handleChangeLimit = this.handleChangeLimit.bind(this);
    this.$onInit = $onInit.bind(this);
  }

  changeSort(key) {
    let desc = false;
    if (key === this.sort.key) {
      desc = !this.sort.desc;
    }

    this.onChangeSort({ key, desc });
  }

  handleChangeLimit(limit) {
    this.PaginationService.setPaginationLimit(this.tableKey, limit);
    this.onChangeLimit(limit);
  }

  $onInit() {
    this.$onInitGeneric();

    const limit = this.PaginationService.getPaginationLimit(this.tableKey);
    if (limit) {
      this.onChangeLimit(+limit);
    }
  }
}
