import angular from 'angular';

class EdgeGroupsDatatableController {
  /* @ngInject */
  constructor($scope, $controller, DatatableService) {
    angular.extend(
      this,
      $controller('GenericDatatableController', { $scope: $scope })
    );
    this.DatatableService = DatatableService;
  }

  disableRemove(item) {
    return item.Inherited;
  }

  allowSelection(item) {
    return !this.disableRemove(item);
  }

  $onInit() {
    this.setDefaults();
    this.prepareTableFromDataset();

    this.state.orderBy = this.orderBy;
    const storedOrder = this.DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }

    const textFilter = this.DatatableService.getDataTableTextFilters(this.tableKey);
    if (textFilter !== null) {
      this.state.textFilter = textFilter;
      this.onTextFilterChange();
    }

    const storedFilters = this.DatatableService.getDataTableFilters(this.tableKey);
    if (storedFilters !== null) {
      this.filters = storedFilters;
    }
    if (this.filters && this.filters.state) {
      this.filters.state.open = false;
    }

    const storedSettings = this.DatatableService.getDataTableSettings(this.tableKey);
    if (storedSettings !== null) {
      this.settings = storedSettings;
      this.settings.open = false;
    }
    this.onSettingsRepeaterChange();
  }
}

angular
  .module('portainer.edge')
  .controller('EdgeGroupsDatatableController', EdgeGroupsDatatableController);

export default EdgeGroupsDatatableController;
