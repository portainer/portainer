export default class AccessTokensDatatableController {
  /* @ngInject*/
  constructor($scope, $state, $controller, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.onClickAdd = () => {
      if (this.uiCanExit()) {
        $state.go('portainer.account.new-access-token');
      }
    };

    this.$onInit = function () {
      this.setDefaults();
      this.prepareTableFromDataset();

      const storedOrder = DatatableService.getDataTableOrder(this.tableKey);
      if (storedOrder !== null) {
        this.state.reverseOrder = storedOrder.reverse;
        this.state.orderBy = storedOrder.orderBy;
      }

      const textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
        this.onTextFilterChange();
      }

      const storedFilters = DatatableService.getDataTableFilters(this.tableKey);
      if (storedFilters !== null) {
        this.filters = storedFilters;
      }
      if (this.filters && this.filters.state) {
        this.filters.state.open = false;
      }

      this.onSettingsRepeaterChange();
    };
  }
}
