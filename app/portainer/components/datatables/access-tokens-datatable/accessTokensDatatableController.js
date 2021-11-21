angular.module('portainer.app').controller('AccessTokensDatatableController', AccessTokensDatatableController);

/* @ngInject */
function AccessTokensDatatableController($scope, $controller, Authentication, DatatableService) {
  angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

  this.$onInit = function () {
    this.isAdmin = Authentication.isAdmin();
    this.setDefaults();
    this.prepareTableFromDataset();

    this.state.orderBy = this.orderBy;
    var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }

    var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
    if (textFilter !== null) {
      this.state.textFilter = textFilter;
      this.onTextFilterChange();
    }

    var storedFilters = DatatableService.getDataTableFilters(this.tableKey);
    if (storedFilters !== null) {
      this.filters = storedFilters;
    }
    if (this.filters && this.filters.state) {
      this.filters.state.open = false;
    }

    this.onSettingsRepeaterChange();
  };
}
